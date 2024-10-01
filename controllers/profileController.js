import profileModel from "../models/profileModel.js";
import userModel from "../models/userModel.js";
import path from 'path';



// Logic to create profile
const getProfile = async (req, res) => {
    try {
        const { username, email } = req.body;

        const imagePath = req.file.path;

        const filename = path.basename(imagePath);
       
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User does not exist' });
        }

        if (!req.file) {
            return res.json({ success: false, message: 'Image is required' });
        }

        // i am creating new profile with userId reference
        const newProfile = new profileModel({
            userId: user._id,  
            username,
            image: filename,
        });
        
        const profile = await newProfile.save();

        return res.json({ 
            success: true, 
            profile: {
                ...profile.toObject(),
                image: `${process.env.BACKEND_URL}/uploads/${filename}`, 
            } 
        });

    } catch (error) {
        console.log('Error creating profile:', error); 
        return res.json({ success: false, message: error.message });
    }
};

// Logic to update profile
const updateProfile = async (req, res) => {
    try {
        const { email, username } = req.body;

        const imagePath = req.file.path

        const filename = path.basename(imagePath);
       
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

       
        const profile = await profileModel.findOne({ userId: user._id });

        if (!profile) {
            return res.json({ success: false, message: 'Profile not found' });
        }

        
        profile.username = username;
        profile.image = req.file ? filename : profile.image;

       
        const updatedProfile = await profile.save();

        return res.json({ 
            success: true, 
            profile: {
                ...updatedProfile.toObject(),
                image: `${process.env.BACKEND_URL}/uploads/${filename}`, 
            } 
        });

    } catch (error) {
        console.log('Error updating profile:', error);
        return res.json({ success: false, message: error.message });
    }
};


const fetchProfile = async (req, res) => {
    try {
        
        const { userId } = req.body; 

        
        const profile = await profileModel.findOne({ userId });

        if (!profile) {
            return res.json({ success: false, message: 'Profile not found' });
        }

        
        return res.json({
            success: true,
            profile: {
                ...profile.toObject(),
                image: `${process.env.BACKEND_URL}/uploads/${profile.image}`, 
            }
        });
    } catch (error) {
        console.log('Error fetching profile:', error);
        return res.json({ success: false, message: error.message });
    }
};




export { fetchProfile, updateProfile, getProfile };



