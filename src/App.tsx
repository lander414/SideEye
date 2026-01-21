// src/App.tsx
import LiquidChrome from './assets/backgrounds/LiquidChrome';

function App() {
  return (
    <div className="App">
      <LiquidChrome 
        logoUrl="/Sideeye-logo-nobg.png" 
        baseColor={[0.2, 0.2, 0.3]}
        speed={0.15}
        amplitude={0.4}
        frequencyX={2.5}
        frequencyY={3.5}
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
        }}
      />
    </div>
  );
}

export default App;