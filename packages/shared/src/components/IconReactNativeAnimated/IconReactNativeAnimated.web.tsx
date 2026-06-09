import React, {useEffect} from 'react';

const STYLE_ID = 'kepler-tv-web-animation';

function ensureAnimationStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes kepler-tv-spin {
      from { transform: rotate(0deg) scale(0.94); }
      50% { transform: rotate(180deg) scale(1.06); }
      to { transform: rotate(360deg) scale(0.94); }
    }
  `;
  document.head.appendChild(style);
}

export const IconReactNativeAnimated = () => {
  useEffect(() => {
    ensureAnimationStyles();
  }, []);

  const orbitStyle: React.CSSProperties = {
    position: 'absolute',
    left: 15,
    top: 96,
    width: 230,
    height: 68,
    border: '5px solid #62D9FF',
    borderRadius: '50%',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        width: 560,
        height: 380,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <div
        style={{
          position: 'relative',
          width: 260,
          height: 260,
          animation: 'kepler-tv-spin 5s linear infinite',
        }}>
        <div
          style={{
            position: 'absolute',
            left: 111,
            top: 111,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#62D9FF',
          }}
        />
        <div style={orbitStyle} />
        <div style={{...orbitStyle, transform: 'rotate(60deg)'}} />
        <div style={{...orbitStyle, transform: 'rotate(120deg)'}} />
      </div>
      <div
        style={{
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
          fontSize: 28,
          fontWeight: 700,
          marginTop: 16,
        }}>
        REACT NATIVE WEB
      </div>
    </div>
  );
};
