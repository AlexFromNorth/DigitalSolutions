import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/widgets/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/entities/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: 'hsl(220 14% 96%)',
          border: 'hsl(220 13% 91%)',
          header: 'hsl(220 14% 92%)',
        },
        accent: {
          DEFAULT: 'hsl(262 83% 58%)',
          hover: 'hsl(262 83% 50%)',
          muted: 'hsl(262 40% 92%)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
