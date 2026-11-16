
import { Pose, PoseCategory } from './types';

const createPose = (id: string, name: string, cat: PoseCategory, desc: string, img: string, count: number = 1): Pose => ({
  id, name, category: cat, description: desc, imageUrl: img, participantsCount: count
});

// Base Curada Profissional (Fundação do Catálogo)
const basePoses: Pose[] = [
  // --- MODELING / EDITORIAL ---
  createPose('mod-1', 'Editorial: Looking Back', 'Modeling', 'Postura de ombro por cima do ombro, olhando para a câmera.', 'https://img.icons8.com/ios-filled/200/fashion-model.png'),
  createPose('mod-2', 'Sitting: Power Pose', 'Modeling', 'Sentada com pernas abertas e mãos nos joelhos, olhar fixo.', 'https://img.icons8.com/ios-filled/200/pose.png'),
  createPose('mod-3', 'High Fashion: Leaning', 'Modeling', 'Inclinada contra uma parede imaginária com angulação de quadril.', 'https://img.icons8.com/ios-filled/200/model.png'),
  
  // --- REHAB / MOBILITY ---
  createPose('reh-1', 'Shoulder Mobility: Wall Slide', 'Rehab', 'Costas na parede, deslizando braços em formato de W.', 'https://img.icons8.com/ios-filled/200/physiotherapy.png'),
  createPose('reh-2', 'Lumbar Stretch: Child Pose Alt', 'Rehab', 'Variação terapêutica para descompressão lombar.', 'https://img.icons8.com/ios-filled/200/rehabilitation.png'),
  
  // --- OFFICE / ERGONOMICS ---
  createPose('off-1', 'Desk Stretch: Wrist Flex', 'Office', 'Alongamento de punhos para usuários de computador.', 'https://img.icons8.com/ios-filled/200/office-worker.png'),
  createPose('off-2', 'Chair Twist', 'Office', 'Torção de coluna sentada para aliviar tensão laboral.', 'https://img.icons8.com/ios-filled/200/work.png'),

  // --- SENIOR / INCLUSIVE ---
  createPose('sen-1', 'Gentle Standing Balance', 'Senior', 'Equilíbrio suave com apoio próximo.', 'https://img.icons8.com/ios-filled/200/old-man.png'),
  createPose('sen-2', 'Seated Leg Lift', 'Senior', 'Fortalecimento de quadríceps sentado.', 'https://img.icons8.com/ios-filled/200/elderly-person.png'),

  // --- KIDS ---
  createPose('kid-1', 'The Flamingo', 'Kids', 'Equilíbrio lúdico imitando um flamingo.', 'https://img.icons8.com/ios-filled/200/baby.png'),
  createPose('kid-2', 'Super Hero Flight', 'Kids', 'Deitado de bruços com braços e pernas elevados.', 'https://img.icons8.com/ios-filled/200/boy.png')
];

// Gerador Avançado para atingir 5.000 poses
const generateMassiveLibrary = (): Pose[] => {
  const library: Pose[] = [...basePoses];
  const target = 5000;
  const categories: PoseCategory[] = [
    'Gym', 'Pilates', 'Yoga', 'Couple', 'Sports', 'Dance', 'MartialArts', 
    'Functional', 'Stretching', 'Modeling', 'Senior', 'Kids', 'Rehab', 'Office'
  ];
  
  const currentCount = library.length;
  const needed = target - currentCount;

  for (let i = 0; i < needed; i++) {
    const cat = categories[i % categories.length];
    let img = 'https://img.icons8.com/ios-filled/200/fitness.png';
    let suffix = 'Avançada';
    
    // Mapeamento de Ícones por Categoria
    switch(cat) {
      case 'Gym': img = 'https://img.icons8.com/ios-filled/200/dumbbell.png'; break;
      case 'Pilates': img = 'https://img.icons8.com/ios-filled/200/pilates.png'; break;
      case 'Yoga': img = 'https://img.icons8.com/ios-filled/200/yoga-pose.png'; break;
      case 'Sports': img = 'https://img.icons8.com/ios-filled/200/trophy.png'; break;
      case 'Dance': img = 'https://img.icons8.com/ios-filled/200/ballet.png'; break;
      case 'MartialArts': img = 'https://img.icons8.com/ios-filled/200/boxing-glove.png'; break;
      case 'Couple': img = 'https://img.icons8.com/ios-filled/200/group.png'; break;
      case 'Functional': img = 'https://img.icons8.com/ios-filled/200/weightlifting.png'; break;
      case 'Stretching': img = 'https://img.icons8.com/ios-filled/200/stretching.png'; break;
      case 'Modeling': img = 'https://img.icons8.com/ios-filled/200/fashion-model.png'; break;
      case 'Senior': img = 'https://img.icons8.com/ios-filled/200/elderly-person.png'; break;
      case 'Kids': img = 'https://img.icons8.com/ios-filled/200/baby.png'; break;
      case 'Rehab': img = 'https://img.icons8.com/ios-filled/200/rehabilitation.png'; break;
      case 'Office': img = 'https://img.icons8.com/ios-filled/200/office-worker.png'; break;
    }

    if (i % 3 === 0) suffix = 'Técnica';
    if (i % 3 === 1) suffix = 'Elite';
    if (i % 3 === 2) suffix = 'Profissional';

    library.push(createPose(
      `pose-idx-${i}`,
      `${cat} ${suffix} #${Math.floor(i/categories.length) + 1}`,
      cat,
      `Variação específica ${suffix.toLowerCase()} para profissionais de nível avançado na área de ${cat}.`,
      img,
      cat === 'Couple' ? 2 : 1
    ));
  }
  
  return library;
};

export const POSES: Pose[] = generateMassiveLibrary();
