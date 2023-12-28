import { Dayjs } from "dayjs";

let request: IDBOpenDBRequest;
let db: IDBDatabase;
let version = 6;

export interface Chat {
  id: string;
  title: string;
  date: number;
}
export interface Conversation {
  id: string;
  ids?: Object;
  chatId: string;
  owner: "ai" | "me" | "time";
  model: string;
  images?: [];
  text: string;
  originText: string;
  date: number;
  done: true | false;
}
export interface Prompt {
  id: number | string;
  act: string;
  prompt: string;
}
export interface ModelConfig {
  id: number | string;
  systemMessage: string;
  model: string;
  temperature: number;
  presence_penalty: number;
  frequency_penalty: number;
  top_p: number;
}
export enum Stores {
  ChatList = "chatList",
  ConversationList = "conversationList",
  PromptList = "promptList",
  ModelConfig = "modelConfig",
}

export const initDB = (): Promise<boolean | IDBDatabase> => {
  return new Promise((resolve) => {
    request = indexedDB.open("myDB", version);

    // if the data object store doesn't exist, create it
    request.onupgradeneeded = (event: any) => {
      db = event.target.result;

      if (!db.objectStoreNames.contains(Stores.ChatList)) {
        // console.log("Creating chatList store");
        const objectStore = db.createObjectStore(Stores.ChatList, {
          keyPath: "id",
        });
        objectStore.createIndex("title", "title", { unique: false });
      }
      if (!db.objectStoreNames.contains(Stores.ConversationList)) {
        // console.log("Creating conversationList store");
        const objectStore = db.createObjectStore(Stores.ConversationList, {
          keyPath: "id",
        });
        objectStore.createIndex("chatId", "chatId", { unique: false });
        objectStore.createIndex("owner", "owner", { unique: false });
        objectStore.createIndex("text", "text", { unique: false });
        objectStore.createIndex("originText", "originText", { unique: false });
        objectStore.createIndex("value", "value", { unique: false });
        objectStore.createIndex("done", "done", { unique: false });
      }
      if (!db.objectStoreNames.contains(Stores.PromptList)) {
        // console.log("Creating promptList store");
        const objectStore = db.createObjectStore(Stores.PromptList, {
          keyPath: "id",
        });
        objectStore.createIndex("act", "act", { unique: false });
        objectStore.createIndex("prompt", "prompt", { unique: false });
      }
      if (!db.objectStoreNames.contains(Stores.ModelConfig)) {
        // console.log("Creating modelConfig store");
        const objectStore = db.createObjectStore(Stores.ModelConfig, {
          keyPath: "id",
        });
        objectStore.createIndex("systemMessage", "systemMessage", {
          unique: false,
        });
        objectStore.createIndex("model", "model", { unique: false });
        objectStore.createIndex("temperature", "temperature", {
          unique: false,
        });
        objectStore.createIndex("presence_penalty", "presence_penalty", {
          unique: false,
        });
        objectStore.createIndex("frequency_penalty", "frequency_penalty", {
          unique: false,
        });
        objectStore.createIndex("top_p", "top_p", { unique: false });
      }
      // no need to resolve here
    };

    request.onsuccess = (event: any) => {
      if (event?.target?.result) {
        db = event.target.result;

        // get current version and store it
        version = db.version;
        // console.log("数据库打开成功");

        resolve(event.target.result);
      }
    };

    request.onerror = (e) => {
      resolve(false);
    };
  });
};

export const addData = <T>(
  storeName: string,
  data: T
): Promise<T | string | null> => {
  return new Promise((resolve) => {
    request = indexedDB.open("myDB", version);

    request.onsuccess = (event: any) => {
      // console.log("request.onsuccess - addData", data);
      if (event?.target?.result) {
        db = event.target.result;
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.add(data);
        resolve(data);
      }
    };

    request.onerror = () => {
      const error = request.error?.message;
      if (error) {
        resolve(error);
      } else {
        resolve("Unknown error");
      }
    };
  });
};

export const getData = <T>(
  storeName: string,
  key: string
): Promise<T | string | null> => {
  return new Promise((resolve) => {
    request = indexedDB.open("myDB", version);

    request.onsuccess = (event: any) => {
      // console.log("request.onsuccess - getData", key);
      if (event?.target?.result) {
        db = event.target.result;
        const tx = db.transaction(storeName);
        const store = tx.objectStore(storeName);
        const res = store.get(key);
        res.onsuccess = () => {
          resolve(res.result);
        };
        res.onerror = () => {
          resolve(null);
        };
      }
    };
  });
};

export const deleteData = (
  storeName: string,
  key: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    request = indexedDB.open("myDB", version);

    // console.log("request.onsuccess - deleteData", key);
    request.onsuccess = (event: any) => {
      if (event?.target?.result) {
        db = event.target.result;
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const res = store.delete(key);
        res.onsuccess = () => {
          resolve(true);
        };
        res.onerror = () => {
          resolve(false);
        };
      }
    };
  });
};

export const deleteStore = (storeName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    request = indexedDB.open("myDB", version);

    // console.log("request.onsuccess - deleteStore", storeName);
    request.onsuccess = (event: any) => {
      if (event?.target?.result) {
        db = event.target.result;
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const res = store.clear();
        res.onsuccess = () => {
          resolve(true);
        };
        res.onerror = () => {
          resolve(false);
        };
      }
    };
  });
};

export const updateData = <T>(
  storeName: string,
  key: string,
  data: T
): Promise<T | string | null> => {
  return new Promise((resolve) => {
    request = indexedDB.open("myDB", version);

    request.onsuccess = (event: any) => {
      // console.log("request.onsuccess - updateData", key);
      if (event?.target?.result) {
        db = event.target.result;
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const res = store.get(key);
        res.onsuccess = () => {
          const newData = { ...res.result, ...data };
          store.put(newData);
          resolve(newData);
        };
        res.onerror = () => {
          resolve(null);
        };
      }
    };
  });
};

export const getStoreData = <T>(storeName: Stores): Promise<T[]> => {
  return new Promise((resolve) => {
    request = indexedDB.open("myDB", version);
    // console.log("request.onsuccess - getAllData");
    request.onsuccess = (event: any) => {
      if (event?.target?.result) {
        db = event?.target?.result;
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const res = store.getAll();
        res.onsuccess = () => {
          resolve(res.result);
        };
      }
    };
  });
};

export {};
