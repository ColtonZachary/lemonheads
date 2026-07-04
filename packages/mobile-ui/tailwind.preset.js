/** Site + shadcn semantic tokens for NativeWind (matches website globals.css). */
module.exports = {
  theme: {
    extend: {
      colors: {
        bk: "#080808",
        background: "#0e0e0e",
        foreground: "#edeae0",
        card: {
          DEFAULT: "#111318",
          foreground: "#edeae0",
        },
        primary: {
          DEFAULT: "#f0c93a",
          foreground: "#080808",
        },
        secondary: {
          DEFAULT: "#161820",
          foreground: "#edeae0",
        },
        muted: {
          DEFAULT: "#161820",
          foreground: "#888888",
        },
        accent: {
          DEFAULT: "#161820",
          foreground: "#edeae0",
        },
        destructive: {
          DEFAULT: "#f87171",
          foreground: "#080808",
        },
        border: "rgba(255,255,255,0.1)",
        input: "rgba(255,255,255,0.12)",
        ring: "#f0c93a",
        y: "#f0c93a",
      },
      borderRadius: {
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
    },
  },
};
