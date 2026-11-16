
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Pose, Message } from "./types";
import { POSES } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const transformImage = async (userImageBase64: string, selectedPose: Pose): Promise<string> => {
  const imageData = userImageBase64.replace(/^data:image\/\w+;base64,/, "");

  const participantContext = selectedPose.participantsCount > 1 
    ? `There are TWO people involved in this pose.`
    : `There is ONE person involved in this pose.`;

  const prompt = `
    TASK: Transform the subjects in the provided image into the following yoga/artistic pose: "${selectedPose.name}".
    POSE CATEGORY: ${selectedPose.category}.
    POSE DESCRIPTION: ${selectedPose.description}.
    ${participantContext}
    
    INSTRUCTIONS:
    - Keep the subjects' identities, clothing, and environment consistent.
    - Adjust only the body posture to match the "${selectedPose.name}" exactly.
    - Preserve lighting and background details.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: imageData, mimeType: 'image/jpeg' } },
          { text: prompt },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Transformation error:", error);
    throw error;
  }
};

const recommendPoseFunction: FunctionDeclaration = {
  name: 'recommendPose',
  parameters: {
    type: Type.OBJECT,
    description: 'Recomenda um exercício específico do catálogo baseado na necessidade do usuário.',
    properties: {
      poseId: {
        type: Type.STRING,
        description: 'O ID do exercício recomendado do catálogo.',
      },
      explanation: {
        type: Type.STRING,
        description: 'Por que este exercício foi escolhido e como ele ajuda o usuário.',
      }
    },
    required: ['poseId', 'explanation'],
  },
};

export const getInstructorResponse = async (
  userInput: string, 
  history: Message[], 
  userImageBase64?: string | null
): Promise<{ text: string, suggestedPose?: Pose }> => {
  const contents = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const userParts: any[] = [{ text: userInput }];
  if (userImageBase64) {
    const imageData = userImageBase64.replace(/^data:image\/\w+;base64,/, "");
    userParts.push({
      inlineData: { data: imageData, mimeType: 'image/jpeg' }
    });
  }

  contents.push({ role: 'user', parts: userParts });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction: `Você é um Instrutor Técnico de Elite. 
      Seu objetivo é orientar usuários sobre exercícios físicos (Academia, Pilates, Yoga, etc).
      1. Explique a importância de cada movimento.
      2. Diga quais músculos são trabalhados.
      3. Explique como um exercício complementa outro.
      4. Se o usuário enviou uma foto, analise a postura ou biotipo para recomendar algo específico.
      5. Você tem acesso a um catálogo de 5000 poses. Use a ferramenta 'recommendPose' para sugerir um exercício específico pelo ID.
      IDs comuns seguem padrões como 'gym-1', 'pil-1', 'yoga-1', 'extra-0' até 'extra-4800'.
      Seja motivador, técnico e preciso. Responda em Português.`,
      tools: [{ functionDeclarations: [recommendPoseFunction] }],
    },
  });

  let text = response.text || "";
  let suggestedPose: Pose | undefined;

  if (response.functionCalls) {
    const call = response.functionCalls.find(f => f.name === 'recommendPose');
    if (call) {
      const { poseId, explanation } = call.args as any;
      suggestedPose = POSES.find(p => p.id === poseId);
      text = explanation || text;
    }
  }

  return { text, suggestedPose };
};
