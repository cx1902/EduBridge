import React from 'react';
import { useThemeStore } from '../store/themeStore';

const Settings = () => {
  const { theme, setTheme, fontSize, setFontSize } = useThemeStore();

  return (
    <div className="container">
      <h1>Settings</h1>
      <div className="card mt-lg">
        <h3>Appearance</h3>
        <div className="form-group">
          <label>Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="high_contrast">High Contrast</option>
          </select>
        </div>
        <div className="form-group">
          <label>Font Size</label>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra_large">Extra Large</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;
