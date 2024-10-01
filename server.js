import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import profileRouter from './routes/profile.Route.js'
import path from 'path'
import { fileURLToPath } from 'url';


// App config
const app = express()
const port = process.env.PORT || 4000
connectDB();
connectCloudinary()


// middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// api endpoints
app.use('/api/user', userRouter);
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/profile', profileRouter)


app.get('/',(req, res)=>{
    res.send('API is running')
})

app.listen(port, ()=> console.log('Server started on PORT : '+ port))