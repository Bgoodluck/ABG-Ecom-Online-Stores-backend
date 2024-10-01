import { v2 as cloudinary } from 'cloudinary'
import productModel from '../models/productModel.js'


// {-----this is the logic to add product}
const addProduct = async (req,res)=>{

    try {
        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;

        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1,image2,image3,image4].filter((item)=> item !== undefined)

        //{--now we have to save all the images to the cloudinary, so we can fetch them from there and the logic is below}
        let imagesUrl = await Promise.all(
            images.map(async(item)=>{
                let result = await cloudinary.uploader.upload(item.path, {resource_type:'image'});
                return result.secure_url;
            })
        )

        // {now to save all these data including the images gotten from cloudinary into my mongoDB }
        // {--this is the logic to save the product to the db, so we would convert the price from string to number}
        // { i also have to convert the bestseller from string to boelean and the sizes would be converted from array to string and to one array again}
        const productData = {
            name,
            description,
            price: Number(price),
            category,
            subCategory,
            sizes: JSON.parse(sizes),
            bestseller: bestseller === "true" ? true : false,
            image: imagesUrl,
            date: Date.now()
        }
        console.log(productData)

        // {--now we have to save the product to the db}
        const product = new productModel(productData);
        await product.save();

        res.json({success:true, message: "Product Added"})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }


}

// {---this is the logic to list products and it's quite simple just using the productModel to find all products.}
const listProducts = async (req,res)=>{

    try {
        
        const products = await productModel.find({});
        res.json({success: true, products})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }


}
// {this is the logic to remove product by using the parameter of req, body and id then the productModel finds by id and delete}
const removeProduct = async (req,res)=>{

    try {
        await productModel.findByIdAndDelete(req.body.id);
        res.json({success: true, message: "Product Removed"})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }


}

//{-------this is the logic for single product info--------}
const singleProduct = async (req,res)=>{

    try {
        const {productId} = req.body;
        const product = await productModel.findById(productId);
        res.json({success: true, product})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }


}


export { listProducts, addProduct, removeProduct, singleProduct}