# 🧳 Listy - Smart Packing List Generator

A smart, stateless, and personalized packing list generator designed as a highly-optimized mobile website. The application has a fun, fast, and playful vibe, requiring minimal user input to generate comprehensive, personalized packing lists for multiple travelers.

## ✨ Features

- **Smart AI-Powered Lists**: Two-step AI process that analyzes trip details and generates personalized packing lists
- **Mobile-First Design**: Optimized for mobile devices with a beautiful, responsive interface
- **Multiple Travelers**: Support for multiple travelers with individual packing lists
- **Progressive Form**: Fields appear gracefully as users provide more information
- **Interactive Lists**: Check off items as you pack them
- **No Accounts Required**: Completely stateless - no signup or login needed

## 🚀 Tech Stack

- **Frontend**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **AI**: OpenAI GPT-4o API
- **Deployment**: Vercel (recommended) or any serverless platform

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd listy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for GPT-4o access | Yes |
| `OPENCAGE_API_KEY` | OpenCage Geocoding API key (future use) | No |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key (future use) | No |

## 🎯 How It Works

### Two-Step AI Process

1. **Trip Detective AI**: Analyzes user input to understand:
   - Trip destination and context
   - Traveler information and personas
   - Inferred activities and weather
   - Location details and requirements

2. **Personal Packer AI**: Generates customized packing lists for each traveler based on:
   - Individual persona and needs
   - Trip context and activities
   - Weather conditions
   - Destination-specific requirements

### User Flow

1. User enters destination
2. Optional fields appear progressively (dates, travelers, purpose, details)
3. AI processes the information and generates personalized lists
4. Results displayed with interactive checkboxes
5. Users can check off items as they pack

## 🎨 Design Philosophy

- **Fun & Friendly**: Bright colors, playful animations, and approachable interface
- **Mobile-First**: Optimized for mobile devices with touch-friendly interactions
- **Progressive Disclosure**: Information revealed gradually to avoid overwhelming users
- **Accessibility**: High contrast, readable fonts, and intuitive navigation

## 🔮 Future Enhancements

- **Weather Integration**: Real-time weather data from OpenWeatherMap API
- **Geocoding**: Precise location data from OpenCage API
- **Export Options**: PDF, checklist, or shareable links
- **Template Library**: Pre-built lists for common trip types
- **Collaboration**: Share lists with travel companions

## 📱 Mobile Optimization

- Responsive design that works on all screen sizes
- Touch-friendly interface elements
- Optimized loading times
- Progressive Web App capabilities

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The app can be deployed to any platform that supports SvelteKit:
- Netlify
- Railway
- Render
- AWS Lambda
- Google Cloud Functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include your environment details and error messages

---

**Happy Packing! 🧳✈️**
