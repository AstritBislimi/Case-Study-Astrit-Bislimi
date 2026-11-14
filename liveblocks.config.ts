declare global {
  interface Liveblocks {
    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string; // Accessible through `user.id`
      info: {
        name: string;
        avatar: string;
      }; // Accessible through `user.info`
    };
    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      x: number; // Normalized image coordinate in the range 0..1
      y: number; // Normalized image coordinate in the range 0..1
      zIndex: number;
    };
  }
}

export {};
