# PrintShopLabel Web
PrintShopLabel Web is a powerful web-based application designed to replicate and modernize the core functionalities of traditional mail merge software like PrintShop Mail. It allows users to generate print-ready A4 PDF layouts from a single card template, complete with variable data, numbering, and barcodes.

The application is built with a modern technology stack, featuring a React frontend for a dynamic user experience and a Node.js backend for robust PDF processing.

## Key Features
- Dynamic PDF Layout Generation : Automatically arranges a small PDF card template (e.g., 92x57mm) into a 2x5 grid on a standard A4 page, centered with precise margins.
- Variable Data & Numbering :
  - Generate sequential numbering based on a specified range (e.g., 00001-00100 ).
  - Import a list of numbers or variable data from a .txt file (CSV-like, with a header).
- Barcode Generation :
  - Optionally add a Code 128 barcode to each label, encoded with the corresponding variable number.
  - Full control over barcode position (X, Y) and dimensions (width, height).
- Live Preview : An interactive preview panel renders a single label in real-time, allowing users to instantly see how text and barcodes will appear before final generation.
- Customizable Text : Users can precisely control the font, size, color, and position (X, Y coordinates) of the variable text on each label.
- A4 Background Support : Ability to upload a full-page A4 PDF to serve as a background for each generated sheet, perfect for branded stationery or pre-printed forms.
- Modern UI/UX : A stylish and intuitive user interface featuring a glassmorphism effect, smooth gradients, and clear, organized controls for a professional user experience.
## Technology Stack
- Frontend :
  - React : For building a fast, interactive, and component-based user interface.
  - CSS : Modern styling with gradients, custom properties (variables), and responsive design principles.
- Backend :
  - Node.js & Express : For creating a fast and reliable REST API server.
  - pdf-lib : A powerful library for creating and modifying PDF documents in Node.js. Used for layout generation and text/image placement.
  - bwip-js : A high-quality barcode generation library for creating PNG barcode images on the fly.
  - Multer : A middleware for handling multipart/form-data , used for file uploads (PDF templates, TXT data, etc.).
- Deployment :
  - Nginx : Serves as a high-performance reverse proxy to serve the static React frontend and forward API requests to the Node.js backend.
  - PM2 : A production process manager for Node.js applications, ensuring the backend runs continuously and restarts automatically after crashes.
  - AWS EC2 : The project is configured for easy deployment on an Amazon EC2 instance running Debian.
## How It Works
1. Upload Assets : The user uploads a PDF card template and, optionally, a background PDF and a .txt file with variable data.
2. Customize : Using the settings panel, the user adjusts the position, font, and style of the text and barcode.
3. Live Preview : With each adjustment, the frontend sends a request to the /generate-preview endpoint. The backend generates a single-label PDF with the applied settings, which is then displayed in an iframe.
4. Generate Final PDF : When ready, the user clicks "Generate Final PDF". The frontend sends all assets and settings to the /generate-pdf endpoint.
5. Backend Processing : The Node.js server iterates through the list of numbers, creates new A4 pages, draws the optional background, places the 10 card templates, and overlays the corresponding text and barcode on each card.
6. Download : The final, multi-page PDF is sent back to the client, initiating an automatic download.
