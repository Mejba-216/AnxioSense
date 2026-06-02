export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f8', 100: '#e9ebed', 200: '#d1d5d9',
          300: '#aeb4bc', 400: '#838c97', 500: '#69727d',
          600: '#555c66', 700: '#454a53', 800: '#3b3f46',
          900: '#34373d', 950: '#212327',
        },
        sage: {
          50: '#f4f8f5', 100: '#e6efe7', 200: '#cddfd0',
          300: '#a6c5ac', 400: '#78a482', 500: '#5a8865',
          600: '#446d4f', 700: '#385741', 800: '#2f4636',
          900: '#283a2e', 950: '#142019',
        },
        coral: {
          50: '#fef4f1', 100: '#fde6df', 200: '#fbcfc1',
          300: '#f7ad97', 400: '#f08066', 500: '#e75a3c',
          600: '#d4422a', 700: '#b13322', 800: '#922d22',
          900: '#7a2922', 950: '#42120d',
        },
        amber: {
          50: '#fefbf3', 100: '#fdf5dc', 200: '#fae8b3',
          300: '#f6d680', 400: '#f0bb4a', 500: '#eba228',
          600: '#d6841d', 700: '#b1611b', 800: '#8e4d1d',
          900: '#75401c', 950: '#421f0a',
        },
        cream: '#fcfaf6',
        paper: '#faf7f0',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 6rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.75rem, 3.5vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      animation: {
        'fade-in': 'fade-in 0.8s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}