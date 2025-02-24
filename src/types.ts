export interface Post {
  id: string;
  content: string;
  firstComment?: string;
  imageUrl?: string;
  imageFile?: File;
  scheduledFor: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
  selectedPages: FacebookPage[];
}

export interface PostFormData {
  content: string;
  firstComment?: string;
  imageUrl?: string;
  imageFile?: File;
  scheduledFor: string;
  selectedPages: FacebookPage[];
}

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface PostError {
  message: string;
  code?: string;
  details?: string;
}