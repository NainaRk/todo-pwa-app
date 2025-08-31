import React, { useEffect, useState } from "react";
import axiosClient from "./axiosClient";
import {
  idbGetTodos,
  idbAddTodo,
  idbDeleteTodo,
  queueSync,
  getSyncQueue,
  clearSyncItem,
} from "./idb";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState("");

  useEffect(() => {
    fetchTodos();
    window.addEventListener("online", syncQueuedChanges);
    return () => window.removeEventListener("online", syncQueuedChanges);
  }, []);

  const fetchTodos = async () => {
    if (!navigator.onLine) {
      const offlineTodos = await idbGetTodos();
      setTodos(offlineTodos);
      return;
    }

    try {
      const res = await axiosClient.get("/Todo");
      setTodos(res.data);
      res.data.forEach((todo) => idbAddTodo(todo));
    } catch (err) {
      console.error("Error fetching todos:", err);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!task) return;

    const newTodo = {
      id: crypto.randomUUID(),
      title: task,
      description: "",
      isCompleted: false,
    };

    setTask("");
    setTodos([...todos, newTodo]);
    await idbAddTodo(newTodo);
    await queueSync({ id: newTodo.id, type: "add", todo: newTodo });

    try {
      await axiosClient.post("/Todo", newTodo);
      fetchTodos();
      await clearSyncItem(newTodo.id);
    } catch (err) {
      console.error("Queued for background sync:", err);
    }
  };

  const deleteTodo = async (id) => {
    const filteredTodos = todos.filter((todo) => todo.id !== id);
    setTodos(filteredTodos);
    await idbDeleteTodo(id);
    await queueSync({ id, type: "delete" });

    try {
      await axiosClient.delete(`/Todo/${id}`);
      fetchTodos();
      await clearSyncItem(id);
    } catch (err) {
      console.error("Queued for background sync:", err);
    }
  };

  const toggleTodo = async (id, isCompleted) => {
    try {
      await axiosClient.put(`/Todo/${id}`, { isCompleted: !isCompleted });
      fetchTodos();
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const syncQueuedChanges = async () => {
    const queue = await getSyncQueue();
    for (const change of queue) {
      try {
        if (change.type === "add") {
          await axiosClient.post("/Todo", change.todo);
        } else if (change.type === "delete") {
          await axiosClient.delete(`/Todo/${change.id}`);
        }
        await clearSyncItem(change.id);
      } catch (err) {
        console.error("Sync failed for change:", change, err);
      }
    }
    fetchTodos();
  };

  return (
    <div className="app-container">
      <h1>Todo App</h1>

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter new task"
          className="todo-input"
          aria-label="New task"
        />
        <button type="submit" className="add-button">Add</button>
      </form>

      <ul className="todo-list">
        {todos.map((t) => (
          <li key={t.id} className="todo-item">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={t.isCompleted}
                onChange={() => toggleTodo(t.id, t.isCompleted)}
                aria-label={`Mark ${t.title} as ${t.isCompleted ? 'incomplete' : 'complete'}`}
              />
            </label>

            <span className={`todo-title ${t.isCompleted ? 'completed' : ''}`}>
              {t.title}
            </span>

            <button
              onClick={() => deleteTodo(t.id)}
              className="delete-button"
              aria-label={`Delete ${t.title}`}
            >
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
