import React, { useState, useEffect } from "react";
import { Typography, Paper, Button } from "@mui/material";
import axios from "axios";
import "./styles.css";

function ActivityDetail() {

    const [activities, setActivities] = useState([]); // activities container
    const [isLoaded, setIsLoaded] = useState(false); // state for loading status
    const [error, setError] = useState(null); // state for error handling
    const [imageUrls, setImageUrls] = useState({}); // state to store image URLs

    const fetchActivities = async() => {
        try {
            const response = await axios.get("/activities");
            setActivities(response.data);
        } catch (err) {
            setError(err.message); // Update error state
        } finally {
            setIsLoaded(true);
        }
    };

    // Handle refresh button click
    const refreshActivities = () => {
        setIsLoaded(false); 
        fetchActivities(); 
    };

    // Fetch the image for a given photoId
    const fetchPhoto = async (photoId) => {
        try {
            const response = await axios.get(`/photo/${photoId}`, { responseType: 'blob' });
            const imageUrl = URL.createObjectURL(response.data);
            setImageUrls((prevUrls) => ({ ...prevUrls, [photoId]: imageUrl }));
        } catch (err) {
            console.error("Error fetching image:", err);
        }
    };

    useEffect(() => {
        // call fetchActivities
        fetchActivities();
    }, []);

    useEffect(() => {
        // Fetch images for activities with a photo_id
        activities.forEach((activity) => {
            if (activity.activity_info && activity.activity_info.photo_id && !imageUrls[activity.activity_info.photo_id]) {
                fetchPhoto(activity.activity_info.photo_id);
            }
        });
    }, [activities, imageUrls]);

    if (!isLoaded) return <p>Loading...</p>; // Show loading indicator
    if (error) return <p>Error: {error}</p>; // Show error message

    // mappings for activity display
    const activityMessages = {
        login: "User Login",
        logout: "User Logout",
        register: "New user registered",
        new_photo: "New photo added",
        new_comment: "New comment added"
    };

    return (
    <div className="activity-container">
        <Typography variant="h2">Activities</Typography>

        {/* Refresh Button */}
        <Button variant="contained" color="primary" onClick={refreshActivities} style={{ marginBottom: "20px", marginTop: "20px" }}>
            Refresh Activities
        </Button>

        {activities.map((activity, index) => {
            const { username, activity_date, activity_info, activity_type } = activity;
            const date = new Date(activity_date);
            const photo_id = activity_info && activity_info.photo_id;

            return (
                <Paper key={index} elevation={3} style={{ padding: "20px", marginTop: "20px", backgroundColor: "#f9f9f9"}}>
                    <Typography variant="body1">
                        <strong>Activity: </strong>{activityMessages[activity_type] || ""}
                    </Typography>

                    <Typography variant="body1">
                        <strong>User Name: </strong>{username}
                    </Typography>

                    <Typography variant="body1">
                        <strong>Date and Time: </strong>{date.toLocaleString()}
                    </Typography>

                    <Typography variant="body1">
                        {activity_type === "new_comment" && activity_info.comment && (<span><strong>Comment Text: </strong>{`"${activity_info.comment}"`}</span>)}
                    </Typography>

                    {/* Conditionally render photo thumbnail if photo_id exists */}
                    {photo_id && imageUrls[photo_id] && (
                        <div>
                            <div>
                                {activity_type === "new_photo" && (
                                    <Typography variant="body1">
                                        <strong>Photo Uploaded: </strong>
                                    </Typography>
                                )}
                                {activity_type === "new_comment" && (
                                    <Typography variant="body1">
                                        <strong>Commented On: </strong>
                                    </Typography>
                                )}
                            </div>
                            <img 
                                src={imageUrls[photo_id]} 
                                alt="Thumbnail" 
                                style={{ width: "100px", height: "100px", objectFit: "cover" }} 
                            />
                        </div>
                    )}
                </Paper>
            );
        })}        
    </div>
    );
}

export default ActivityDetail;
