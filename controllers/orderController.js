import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'
import axios from 'axios'





// Global variables
const currency = "GBP"
const deliveryCharge = 10

// My Frontend Url
const frontend_Url = "http:localhost:5173";

// GATEWAY INITILIZATIONS
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
// const flw = process.env.FLW_SECRET_KEY


// {i am creating a code to place orders using cash on delivery Method (cod)}

const placeOrder = async (req, res)=>{

   try {
        const { userId, items, amount, address } = req.body

        const orderData = {
            userId,
            items,
            amount,
            address,
            payment:false,
            paymentMethod: "COD",
            date: Date.now()
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        await userModel.findByIdAndUpdate(userId, {cartData: {}})

        return res.json({success: true, message: "Order Placed"});

   } catch (error) {
        console.log(error)
        return res.json({success: false, message: error.message})
   }

}


// {placing order using stripe Method}

const placeOrderStripe = async (req, res)=>{
    try {
        
        const { userId, items, amount, address } = req.body;

        const { origin } = req.headers;

        const orderData = {
            userId,
            items,
            amount,
            address,
            payment:false,
            paymentMethod: "Stripe",
            date: Date.now()
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        const line_items = items.map((item)=>({
            price_data: {
                currency: currency,
                unit_amount: item.price * 100,
                product_data: {
                    name: item.name
                }
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                unit_amount: deliveryCharge * 100,
                product_data: {
                    name: 'Delivery Charges'
                }
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

             return res.json({success: true, session_url:session.url})

    } catch (error) {
        console.log(error)
        return res.json({success: false, message: error.message}); 
    }   

}
// {verifying Stripe payment}
    const verifyStripe = async (req,res)=>{

        const { orderId, success, userId } = req.body;

        try {
            if (success === "true") {
                await orderModel.findByIdAndUpdate(orderId, {payment:true});
                await userModel.findByIdAndUpdate(userId, {cartData: {}})
                return res.json({success: true});
            }else{
                await orderModel.findByIdAndUpdate(orderId, {payment:false});
                return res.json({success: false});
            }
        } catch (error) {
            console.log(error)
            return res.json({success: false, message: error.message}); 
        }
    }




// {placing order using Razorpay Method}

const placeOrderRazorpay = async (req, res)=>{

   

}



// {placing order using flutterwave Method}

const placeOrderFlutterwave = async (req, res) => {
    try {
        const { userId, items, amount, address, email, phone } = req.body;

       
        if (!amount || !address) {
            return res.json({ success: false, message: 'Amount and address are required' });
        }

        
        const orderData = {
            userId,
            items,
            amount,
            address,
            payment: false,
            paymentMethod: "Flutterwave",
            date: Date.now(),
        };

        
        const newOrder = new orderModel(orderData);
        await newOrder.save();

        
        const payload = {
            tx_ref: newOrder._id, 
            amount,
            currency: 'NGN',
            delivery_fee: deliveryCharge, 
            redirect_url: "http://localhost:5173/cart", 
            customer: {
                email,
                name: userId, 
                phonenumber: phone,
                
            },
            customizations: {
                title: 'ABG Online Stores Payment',
                meta: {
                    amount,
                    address: JSON.stringify(address, null, 2)
                }
            },
        };

        console.log(payload)

       
        const responseFlutterwave = await axios.post(
            'https://api.flutterwave.com/v3/payments',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 
                    'Content-Type': 'application/json',
                },
            }
        );
        // console.log('Flutterwave response:', responseFlutterwave.data);
        return res.json({ success: true, data: { link: responseFlutterwave.data.data.link } });

        // console.log('Flutterwave response:', responseFlutterwave.data);
        // if (responseFlutterwave.data.link) {
            
        //     console.log('Returning success response to frontend:', {
        //         success: true,
        //         data: {
        //             link: flutterwaveResponse.data.data.link
        //         }
        //     });
        //     res.json({ success: true, data: { link: responseFlutterwave.data.data.link } });
        //     // console.log(data, { link: responseFlutterwave.data.data.link })
        // } else {
        //     return res.json({ success: false, message: responseFlutterwave.data.message });
        // }

    } catch (error) {
        console.error(error.response); 
        return res.json({ success: false, message: error.message });
    }
};

// Verify Flutterwave

const verifyFlutterwave = async (req, res) => {
    const { orderId, success, userId, transaction_id, tx_ref } = req.body;
    // const { transaction_id, tx_ref } = req.query;
  
    try {
      console.log('Verifying transaction:', transaction_id, 'with tx_ref:', tx_ref);
  
      
      const verifyPayment = await orderModel.findOne({ _id: tx_ref });
  
      if (!verifyPayment) {
        return res.json({ success: false, message: 'Payment not found' });
      }
  
      
      const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      });
  
      const data = response.data;
      console.log('Flutterwave response:', data);
  
      if (data.status !== 'success') {
        return res.json({ success: false, message: 'Failed to verify payment with Flutterwave' });
      }
  
      
      if (success === 'true') {
        await orderModel.findByIdAndUpdate(orderId, { verifyPayment: true });
        await userModel.findByIdAndUpdate(userId, { cartData: {} });
  
       
        res.redirect(`${frontend_Url}/orders`);
      } else {
        await orderModel.findByIdAndUpdate(orderId, { verifyPayment: false });
        return res.json({ success: false, message: 'Payment verification failed' });
      }
  
    } catch (error) {
      console.error('Error verifying payment:', error.message);
  
      if (error.response) {
        
        console.error('Flutterwave error:', error.response.data);
      }
  
      return res.json({
        success: false,
        message: 'An error occurred while verifying the payment',
      });
    }
  };
  



// {All Order Data for Admin Panel}

const allOrders = async (req, res)=>{

        try {

            const orders = await orderModel.find({});
            return res.json({success: true, orders})

        } catch (error) {
            
            console.log(error)
            return res.json({success: false, message: error.message})
            
        }
   

}


// {User Order Data for frontend}

const userOrders = async (req, res)=>{

    try {
        
         const { userId } = req.body;

         const orders = await orderModel.find({ userId })
         return res.json({success: true, orders})

    } catch (error) {
        console.log(error)
        return res.json({success: false, message: error.message})  
    }
   

}

// {update order status from Admin panel}

const updateStatus = async (req, res)=>{
    try {
        
           const { orderId, status } = req.body;
           
           await orderModel.findByIdAndUpdate(orderId, {status })
           return res.json({success: true, message: 'Status Updated'})

    } catch (error) {
        console.log(error)
        return res.json({success: false, message: error.message})  
    }
   

}


export {
    placeOrder,
    placeOrderStripe,
    placeOrderRazorpay,
    placeOrderFlutterwave,
    allOrders,
    userOrders,
    updateStatus,
    verifyStripe,
    verifyFlutterwave  
}