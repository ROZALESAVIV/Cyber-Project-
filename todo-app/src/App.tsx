import React, { useState, useEffect } from 'react'
import './App.css'

// Types definition
interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string
}

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onEdit: (id: number, newText: string) => void
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState<string>('')

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      try {
        const parsedTodos: Todo[] = JSON.parse(savedTodos)
        setTodos(parsedTodos)
      } catch (error) {
        console.error('Error parsing todos from localStorage:', error)
        // VULNERABILITY 3: localStorage security - storing potentially corrupted data
        localStorage.removeItem('todos')
      }
    }
  }, [])

  // Save todos to localStorage whenever todos change
  // VULNERABILITY 3: localStorage Security - No encryption, data stored in plain text
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  // Add new todo - VULNERABILITY 2: No input validation
  const addTodo = (): void => {
    // No validation for empty strings, length limits, or malicious content
    if (inputValue) {
      const newTodo: Todo = {
        id: Date.now(),
        text: inputValue, // VULNERABILITY 1: No XSS protection - HTML will be rendered
        completed: false,
        createdAt: new Date().toISOString()
      }
      setTodos([...todos, newTodo])
      setInputValue('')
    }
  }

  // Toggle todo completion
  const toggleTodo = (id: number): void => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  // Delete todo
  const deleteTodo = (id: number): void => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  // Edit todo - VULNERABILITY 2: No input validation on edit
  const editTodo = (id: number, newText: string): void => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text: newText } : todo
    ))
  }

  const completedCount: number = todos.filter(todo => todo.completed).length
  const totalCount: number = todos.length

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value)
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>📝 My Todo List</h1>
          <p>Stay organized and get things done!</p>
        </header>

        <div className="add-todo">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Add a new task..."
            onKeyPress={handleKeyPress}
            className="todo-input"
          />
          <button onClick={addTodo} className="add-btn">
            Add Task
          </button>
        </div>

        <div className="stats">
          <span>Total: {totalCount}</span>
          <span>Completed: {completedCount}</span>
          <span>Remaining: {totalCount - completedCount}</span>
        </div>

        <div className="todo-list">
          {todos.length === 0 ? (
            <div className="empty-state">
              <p>🎉 No tasks yet! Add one above to get started.</p>
            </div>
          ) : (
            todos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editText, setEditText] = useState<string>(todo.text)

  const handleEdit = (): void => {
    if (editText.trim()) {
      onEdit(todo.id, editText)
      setIsEditing(false)
    }
  }

  const handleCancel = (): void => {
    setEditText(todo.text)
    setIsEditing(false)
  }

  const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleEdit()
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEditText(e.target.value)
  }

  const handleToggle = (): void => {
    onToggle(todo.id)
  }

  const handleDelete = (): void => {
    onDelete(todo.id)
  }

  const handleEditClick = (): void => {
    setIsEditing(true)
  }

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        className="todo-checkbox"
      />
      
      {isEditing ? (
        <div className="edit-mode">
          <input
            type="text"
            value={editText}
            onChange={handleEditChange}
            onKeyPress={handleEditKeyPress}
            onKeyDown={handleEditKeyDown}
            className="edit-input"
            autoFocus
          />
          <button onClick={handleEdit} className="save-btn">Save</button>
          <button onClick={handleCancel} className="cancel-btn">Cancel</button>
        </div>
      ) : (
        <div className="view-mode">
          {/* VULNERABILITY 1: XSS - Using dangerouslySetInnerHTML without sanitization */}
          <span 
            className="todo-text"
            dangerouslySetInnerHTML={{ __html: todo.text }}
          />
          <div className="todo-actions">
            <button onClick={handleEditClick} className="edit-btn">
              ✏️
            </button>
            <button onClick={handleDelete} className="delete-btn">
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App