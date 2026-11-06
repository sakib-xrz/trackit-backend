const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.json');

const customOptions = {
  customSiteTitle: 'Track It API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 2.2rem; color: #1e293b; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .swagger-ui .btn.authorize { background-color: #2563eb; color: #ffffff; border-color: #2563eb; font-weight: 600; border-radius: 6px; }
    .swagger-ui .btn.authorize svg { fill: #ffffff; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  customOptions,
};

