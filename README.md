# Notes Web App 📝

A modern, cloud-based notes application with user authentication and rich text editing capabilities.

## 🌟 Features

- **User Authentication**: Secure login and registration with Supabase Auth
- **Cloud Storage**: Notes are stored securely in Supabase database  
- **Rich Text Editor**: Full-featured editor powered by Quill.js with comprehensive formatting
- **Real-time Search**: Search across note titles and content
- **Dark/Light Mode**: Toggle between themes with smooth transitions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Data Security**: Row-level security ensures users only see their own notes

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd notes-app
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Register a new account to start using the app

### Production Build
```bash
npm run build
```

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1 + Vite 7.1.14
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS 4.1.14
- **Rich Text**: Quill.js 2.0.3
- **Build Tool**: Vite with fast refresh

## 📋 Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Notes**: Click "New Note" to start writing with rich text formatting
3. **Save Notes**: Notes are automatically synced to the cloud database
4. **Search**: Use the search bar to find specific notes across titles and content
5. **Delete**: Click the delete button on any note to remove it
6. **Dark Mode**: Toggle between light and dark themes

## 🎨 Key Components

- **Authentication**: Secure user management with Supabase Auth
- **Notes Editor**: Rich text editing with comprehensive toolbar
- **Cloud Sync**: Real-time synchronization with Supabase database
- **Responsive UI**: Mobile-first design with collapsible sidebar
- **Theme Support**: Light/dark mode with smooth transitions

## 🔒 Security

- Row Level Security (RLS) ensures data isolation between users
- Secure authentication with Supabase Auth
- Protected routes and API endpoints
- Input sanitization for XSS protection

## 📱 Responsive Features

- Mobile-first design with touch-friendly interface
- Collapsible sidebar for mobile navigation
- Responsive typography and layouts
- Optimized for various screen sizes

## 🔧 Development

Built with modern development practices:
- Fast HMR with Vite
- ESLint for code quality
- Component-based architecture
- Utility-first CSS with Tailwind