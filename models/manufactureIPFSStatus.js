import mongoose from "mongoose";

const manufactureIPFSStatus = new mongoose.Schema(
    {
        manufacture : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PharmaCompany",
            required: true,
        } ,
        timespan : {
            type : String ,
            require : true
        } ,
        status : {
            type : String ,
            require : true
        } ,
        quantity : {
            type : Number , 
            require : true
        } ,
        IPFSUrl : {
            type : String , 
            require : true
        }
    }
)

export default mongoose.model("manufactureIPFSStatus", manufactureIPFSStatus);
