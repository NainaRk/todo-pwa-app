import { openDB } from 'idb';

const dbPromise = openDB('todo-db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('todos')) {
      db.createObjectStore('todos', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('syncQueue')) {
      db.createObjectStore('syncQueue', { keyPath: 'id' });
    }
  },
});

export const idbAddTodo = async (todo) => {
  const db = await dbPromise;
  await db.put('todos', todo);
};

export const idbGetTodos = async () => {
  const db = await dbPromise;
  return await db.getAll('todos');
};

export const idbDeleteTodo = async (id) => {
  const db = await dbPromise;
  await db.delete('todos', id);
};

export const queueSync = async (change) => {
  const db = await dbPromise;
  await db.put('syncQueue', change);
};

export const getSyncQueue = async () => {
  const db = await dbPromise;
  return await db.getAll('syncQueue');
};

export const clearSyncItem = async (id) => {
  const db = await dbPromise;
  await db.delete('syncQueue', id);
};
