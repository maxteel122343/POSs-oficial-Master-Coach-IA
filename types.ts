
export type PoseCategory = 
  | 'Lying' 
  | 'Sitting' 
  | 'Standing' 
  | 'Inverted' 
  | 'Dynamic' 
  | 'Couple' 
  | 'Gym' 
  | 'Pilates' 
  | 'Yoga'
  | 'Stretching'
  | 'Sports'
  | 'Dance'
  | 'MartialArts'
  | 'Functional'
  | 'Modeling'
  | 'Senior'
  | 'Kids'
  | 'Rehab'
  | 'Office';

export interface Pose {
  id: string;
  name: string;
  description: string;
  category: PoseCategory;
  imageUrl: string;
  participantsCount: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  suggestedPose?: Pose;
}

export interface GalleryItem {
  id: string;
  original: string;
  result: string;
  poseName: string;
  timestamp: number;
}

export interface AppState {
  selectedPose: Pose | null;
  userImage: string | null;
  resultImage: string | null;
  isLoading: boolean;
  error: string | null;
  view: 'catalog' | 'instructor' | 'live' | 'gallery';
  chatHistory: Message[];
  gallery: GalleryItem[];
  fromLiveView: boolean; // Rastreia se o usuário veio da aba Live para a Biblioteca
}
