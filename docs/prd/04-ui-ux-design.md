# PRD 04: UI/UX Design & Theming

## 1. Overview

This document outlines the visual design, user experience principles, and theming strategy for the SagasWeave platform. The goal is to create a modern, vibrant, and accessible interface that is both beautiful and intuitive. The design will be implemented using Material-UI (MUI) and will feature a distinct color palette with both light and dark modes.

## 2. Design Philosophy

-   **Clarity & Focus**: The UI should be clean and uncluttered, allowing users to focus on their creative work.
-   **Vibrancy & Modernity**: The color scheme will be colorful and modern, using a palette of purple, pink, and green to create a unique and engaging look.
-   **Consistency**: All components and views will adhere to a consistent design language, ensuring a seamless user experience.
-   **Accessibility**: The design will meet WCAG 2.1 standards for color contrast and readability.

## 3. Color Palette: "Summer Night"

The "Summer Night" theme is inspired by the vibrant colors of a summer evening. It features a rich purple as the primary color, a bright pink/magenta as the secondary, and a fresh green for accents and success states.

### 3.1. Light Theme

-   **Primary**: Deep Purple (`#673ab7`)
-   **Secondary**: Vibrant Pink (`#e91e63`)
-   **Success**: Bright Green (`#4caf50`)
-   **Background (Paper)**: Off-white (`#ffffff`)
-   **Background (Default)**: Light Gray (`#f4f6f8`)
-   **Text (Primary)**: Dark Gray (`#212121`)

### 3.2. Dark Theme

-   **Primary**: Lighter Purple (`#9575cd`)
-   **Secondary**: Lighter Pink (`#f06292`)
-   **Success**: Lighter Green (`#81c784`)
-   **Background (Paper)**: Dark Gray (`#303030`)
-   **Background (Default)**: Near Black (`#121212`)
-   **Text (Primary)**: Off-white (`#e0e0e0`)

## 4. Typography

-   **Font Family**: `Roboto`, `Helvetica`, `Arial`, sans-serif (MUI default)
-   **Headings (`h1`-`h6`)**: Bold weight, using the primary text color.
-   **Body Text**: Regular weight, using the primary text color.

## 5. MUI Theme Implementation

Below is a sample implementation of the "Summer Night" theme using MUI's `createTheme` function. This configuration should be placed in a central theme file and provided to the application via `ThemeProvider`.

```typescript
import { createTheme } from '@mui/material/styles';

// Define the light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#673ab7', // Deep Purple
    },
    secondary: {
      main: '#e91e63', // Vibrant Pink
    },
    success: {
      main: '#4caf50', // Bright Green
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
});

// Define the dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9575cd', // Lighter Purple
    },
    secondary: {
      main: '#f06292', // Lighter Pink
    },
    success: {
      main: '#81c784', // Lighter Green
    },
    background: {
      default: '#121212',
      paper: '#303030',
    },
  },
});
```

## 6. Component Styling Guidelines

-   **AppBar**: Should use the `primary` color as its background.
-   **Buttons**: Primary actions should use the `primary` color. Secondary actions should use the `secondary` color.
-   **Cards & Panels**: Should use the `background.paper` color.
-   **Links**: Should use the `secondary` color to stand out.