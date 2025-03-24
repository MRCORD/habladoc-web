# Habladoc Web

Habladoc is a comprehensive telemedicine platform built with Next.js that enables doctors to conduct, record, analyze, and document medical consultations. The application combines clinical data management, audio recording transcription, medical entity analysis, and standardized diagnostic coding.

## Features

### User Management
- **Doctor Profiles**: Complete professional profiles with specialty, license information, languages, and consultation fees
- **Patient Management**: Patient creation, search, and management with comprehensive medical information

### Clinical Consultation
- **Session Management**: Create and manage medical consultation sessions with patients
- **Patient Medical Records**: View and manage patient medical history, allergies, insurance information, and emergency contacts
- **Audio Recording**: Record, transcribe, and analyze doctor-patient conversations

### Clinical Analysis
- **SOAP Structure**: Organize consultation data following the standard Subjective, Objective, Assessment, Plan (SOAP) medical documentation format
- **Entity Detection**: Automatically identify and categorize medical entities such as:
  - Symptoms
  - Diagnoses
  - Medications
  - Vital signs
  - Physical examination findings
  - Lab results

### Diagnostic Tools
- **ICD-11 Integration**: Search and select standardized diagnoses using the WHO's International Classification of Diseases (ICD-11)
- **Diagnosis Management**: Add, categorize, and manage diagnoses with status tracking (confirmed, ruled out)
- **Clinical Relationships**: Visualize relationships between symptoms and diagnoses

### Timeline and Visualization
- **Consultation Timeline**: Track and visualize the progression of symptoms, diagnoses, and clinical events
- **Entity Visualization**: Group and visualize clinical entities with confidence scores and relationships
- **SOAP Tabs**: Present consultation information in structured, organized tabs

### User Interface
- **Responsive Design**: Fully responsive interface that works on different screen sizes
- **Dark/Light Mode**: Theme support for both light and dark modes
- **Interactive Components**: Cards, badges, and interactive elements for visualizing medical data

## Technology Stack

- **Frontend**: Next.js App Router, React, TypeScript, TailwindCSS
- **State Management**: Zustand for lightweight state management
- **Authentication**: Auth0 integration
- **International Standards**: ICD-11 diagnostic coding through WHO's API
- **API Integration**: REST API connectivity with backend services
- **Responsive UI**: Mobile-friendly interface using TailwindCSS

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app`: Next.js App Router pages and API routes
- `/src/components`: Reusable React components organized by function
  - `/common`: Shared utility components
  - `/dashboard`: Dashboard-specific components
  - `/patient`: Patient management components
  - `/session`: Consultation and analysis components
  - `/ui`: Basic UI components (buttons, cards, etc.)
- `/src/stores`: Zustand state management stores
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions
- `/src/contexts`: React context providers
- `/src/lib`: Core functionality libraries
- `/public`: Static assets and images

## Main Workflows

1. **Doctor Profile Management**: Doctors can create and manage their professional profiles
2. **Patient Search and Creation**: Search for existing patients or create new ones
3. **Consultation Sessions**: Conduct and record medical consultations
4. **Clinical Analysis**: Review automatically analyzed clinical data in SOAP format
5. **Diagnosis Management**: Add and manage diagnoses using ICD-11 codes
6. **Timeline Visualization**: Track patient's clinical history and event timeline

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [ICD-11 API Documentation](https://icd.who.int/icdapi)
