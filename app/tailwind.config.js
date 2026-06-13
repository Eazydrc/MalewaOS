/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Toutes les couleurs pointent vers des variables CSS ──
        // Elles s'inversent automatiquement avec la classe .dark
        bg:              "rgb(var(--color-bg) / <alpha-value>)",
        surface:         "rgb(var(--color-surface) / <alpha-value>)",
        "surface-2":     "rgb(var(--color-surface-2) / <alpha-value>)",
        "surface-3":     "rgb(var(--color-surface-3) / <alpha-value>)",
        border:          "rgb(var(--color-border) / <alpha-value>)",
        "border-strong": "rgb(var(--color-border-strong) / <alpha-value>)",
        text:            "rgb(var(--color-text) / <alpha-value>)",
        "text-2":        "rgb(var(--color-text-2) / <alpha-value>)",
        "text-3":        "rgb(var(--color-text-3) / <alpha-value>)",
        accent:          "rgb(var(--color-accent) / <alpha-value>)",
        "accent-soft":   "rgb(var(--color-accent-soft) / <alpha-value>)",
        "accent-dark":   "rgb(var(--color-accent-dark) / <alpha-value>)",
        "accent-dim":    "rgb(var(--color-accent-dim) / <alpha-value>)",
        success:         "rgb(var(--color-success) / <alpha-value>)",
        "success-soft":  "rgb(var(--color-success-soft) / <alpha-value>)",
        danger:          "rgb(var(--color-danger) / <alpha-value>)",
        "danger-soft":   "rgb(var(--color-danger-soft) / <alpha-value>)",
        warning:         "rgb(var(--color-warning) / <alpha-value>)",
        "warning-soft":  "rgb(var(--color-warning-soft) / <alpha-value>)",
        dark:            "rgb(var(--color-dark) / <alpha-value>)",
      },

      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },

      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },

      letterSpacing: {
        tighter: "-0.04em",
        tight:   "-0.02em",
        snug:    "-0.01em",
        wide:    "0.04em",
        wider:   "0.08em",
      },

      borderRadius: {
        sm:    "6px",
        DEFAULT: "8px",
        md:    "10px",
        lg:    "12px",
        xl:    "16px",
        "2xl": "20px",
        "3xl": "28px",
      },

      boxShadow: {
        card:          "var(--shadow-card)",
        "card-hover":  "var(--shadow-card-hover)",
        input:         "var(--shadow-input)",
        "input-err":   "var(--shadow-input-err)",
        btn:           "var(--shadow-btn)",
        "btn-hover":   "var(--shadow-btn-hover)",
        pill:          "var(--shadow-pill)",
        modal:         "var(--shadow-modal)",
        "glow-accent": "var(--shadow-glow-accent)",
      },

      backgroundImage: {
        "btn-primary":      "var(--btn-primary)",
        "btn-accent":       "linear-gradient(180deg, #F5784A 0%, #E85D26 100%)",
        "surface-gradient": "var(--surface-gradient)",
      },

      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },

      transitionTimingFunction: {
        "spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "snap":   "cubic-bezier(0.87, 0, 0.13, 1)",
      },
    },
  },
  plugins: [],
};
