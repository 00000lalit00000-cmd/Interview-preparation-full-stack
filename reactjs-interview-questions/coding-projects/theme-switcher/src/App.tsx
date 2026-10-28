import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { useTheme } from "./context/ThemeContext";
import "./App.css";

export default function App() {
  const {theme} = useTheme();

  return (
    <div className={`app ${theme}`}>
      <div className="card">
        <h2>Theme switcher</h2>

        <p>Current theme: <strong>{theme}</strong></p>

        <ThemeSwitcher></ThemeSwitcher>
      </div>
    </div>
  )
}