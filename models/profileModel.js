import mongoose from "mongoose";


const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },
    username:{
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
})

const profileModel = mongoose.models.profile || mongoose.model("profile", profileSchema);

export default profileModel;