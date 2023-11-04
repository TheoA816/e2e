const allowlist = [
  "http://localhost:5173",
  "http://localhost:5174"
];

export const corsOptionsDelegate = (req: any, callback: any) => {

  let corsOptions = { 
    origin: false,
    credentials: true
  };

  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions.origin = true; // reflect (enable) the requested origin in the CORS response
  }

  callback(null, corsOptions); // callback expects two parameters: error and options
}