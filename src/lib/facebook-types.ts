export interface PostOptions {
  content: string;
  imageUrl?: string;
  scheduledTime?: Date;
  firstComment?: string;
}

export interface PageStats {
  pageId: string;
  pageName: string;
  totalPosts: number;
  scheduledPosts: number;
  recentEngagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface FacebookConfig {
  retryAttempts: number;
  retryDelay: number;
  navigationTimeout: number;
  delays: {
    navigation: number;
    action: number;
    typing: number;
  };
  selectors: {
    login: {
      email: string;
      password: string;
      submit: string;
      twoFactorCode: string;
      twoFactorSubmit: string;
    };
    page: {
      create: string;
      name: string;
      category: string;
      createButton: string;
      success: string;
    };
    post: {
      composer: string;
      textArea: string;
      imageUpload: string;
      scheduleButton: string;
      dateInput: string;
      timeInput: string;
      publishButton: string;
    };
  };
}