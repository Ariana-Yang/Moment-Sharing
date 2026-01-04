/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 支持深色模式
  theme: {
    extend: {
      colors: {
        // 编辑杂志风格配色 - 大胆对比
        // 浅色模式：温暖奶油色背景 + 深蓝绿文字 + 珊瑚红强调
        // 深色模式：深邃蓝黑背景 + 奶油色文字 + 霓虹粉强调
        gallery: {
          cream: '#F5F1E8',
          sand: '#E8E0D5',
          'cream-dark': '#D9CFC1',
          'deep-teal': '#1A3A3A',
          'teal': '#2C5C5C',
          'coral': '#E86A4B',
          'coral-light': '#F0A08C',
          'coral-dark': '#C94A2E',
          'midnight': '#0F1419',
          'midnight-light': '#1A1F26',
          'neon-pink': '#FF2D7B',
          'neon-pink-light': '#FF6B9D',
          'gold': '#D4A54A',
          'gold-light': '#E8C87A',
        },
        // 保持向后兼容的primary/accent，但使用新配色
        primary: {
          50: '#F5F1E8',
          100: '#E8E0D5',
          200: '#D9CFC1',
          300: '#2C5C5C',
          400: '#1A3A3A',
          500: '#E86A4B',
          600: '#C94A2E',
          700: '#D4A54A',
          800: '#0F1419',
          900: '#1A1F26',
        },
        accent: {
          50: '#FFE8EC',
          100: '#FFD1DD',
          200: '#FFB3C7',
          300: '#FF8CA8',
          400: '#FF2D7B',
          500: '#E86A4B',
          600: '#C94A2E',
          700: '#D4A54A',
          800: '#0F1419',
          900: '#1A1F26',
        }
      },
      boxShadow: {
        // 编辑杂志风格阴影系统 - 更有戏剧性
        'soft': '0 4px 20px rgba(26, 58, 58, 0.08), 0 8px 40px rgba(26, 58, 58, 0.04)',
        'soft-lg': '0 12px 48px rgba(26, 58, 58, 0.12), 0 24px 64px rgba(26, 58, 58, 0.06)',
        'dramatic': '0 8px 32px rgba(232, 106, 75, 0.15), 0 16px 48px rgba(232, 106, 75, 0.08)',
        'dramatic-lg': '0 16px 64px rgba(232, 106, 75, 0.2), 0 32px 96px rgba(232, 106, 75, 0.1)',
        'glow': '0 0 24px rgba(232, 106, 75, 0.3)',
        'glow-lg': '0 0 48px rgba(232, 106, 75, 0.5)',
        'colored': '0 6px 24px rgba(232, 106, 75, 0.2)',
        'colored-lg': '0 12px 48px rgba(232, 106, 75, 0.3)',
        'card': '0 2px 8px rgba(26, 58, 58, 0.06), 0 4px 16px rgba(26, 58, 58, 0.04)',
        'card-hover': '0 8px 32px rgba(26, 58, 58, 0.12), 0 16px 48px rgba(26, 58, 58, 0.08)',
      },
      animation: {
        // 性能优化的动画（使用transform）
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'blob': 'blob 7s infinite',
        'gradient-xy': 'gradientXY 15s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        gradientXY: {
          '0%, 100%': {
            'background-position': '0% 0%',
          },
          '50%': {
            'background-position': '100% 100%',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // 新的渐变系统 - 编辑杂志风格
        'gradient-primary': 'linear-gradient(135deg, #E86A4B 0%, #D4A54A 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #C94A2E 0%, #C4953A 100%)',
        'gradient-soft': 'linear-gradient(135deg, #F5F1E8 0%, #E8E0D5 100%)',
        'gradient-dramatic': 'linear-gradient(135deg, #FF2D7B 0%, #E86A4B 50%, #D4A54A 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0F1419 0%, #1A1F26 100%)',
        // 噪点纹理
        'texture-noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}