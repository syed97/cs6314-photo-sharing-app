import React, { useState, useEffect } from "react";
import { Typography, Button, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import axios from 'axios';
import "./styles.css";

function UserDetail({userId}) {
  // fetch user details
  const [userDetails, setUserDetails] = useState(null);
  const [thumbnailPhotos, setThumbnailPhotos] = useState([]); // for mentions listing
  const [noMentionsMessage, setNoMentionsMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mostCommentedPhoto, setMostCommentedPhoto] = useState(null);
  const [mostRecentPhoto, setMostRecentPhoto] = useState(null);


  // get user details
  useEffect(() => {
    axios.get(`/user/${userId}`)
      .then((response) => {
        setUserDetails(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  }, [userId]);

  // get photos where user is @ mentioned
  useEffect(() => {
    axios.get(`/mentionedPhotos/${userId}`)
    .then((response) => {
      const data = response.data;
      if (data.message) {
        // If the response contains a message field
        setNoMentionsMessage(data.message);
        setThumbnailPhotos([]); // Clear thumbnailPhotos
      } else if (Array.isArray(data)) {
         // If the response is an array
         setThumbnailPhotos(data);
         setNoMentionsMessage(""); // Clear noMentionsMessage if needed
      }
    })
    .catch((error) => {
      console.error("Error fetching data: ", error);
    })
    .finally(() => {
      setIsLoading(false); // Set loading to false after request
    });
  }, [userId]);

  // get photo with most comments
  useEffect(() => {
    axios.get(`/mostCommentsPhoto/${userId}`)
      .then((response) => {
        setMostCommentedPhoto(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  }, [userId]);

  // get most recently uploaded photo
  // get photo with most comments
  useEffect(() => {
    axios.get(`/mostRecentPhoto/${userId}`)
      .then((response) => {
        setMostRecentPhoto(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  }, [userId]);

  const userFields = userDetails
  ? [
      { label: "First Name", value: userDetails.first_name },
      { label: "Last Name", value: userDetails.last_name },
      { label: "Occupation", value: userDetails.occupation },
      { label: "Location", value: userDetails.location },
      { label: "Description", value: userDetails.description },
    ]
  : [];

  return (
    <div className="user-detail-container">
    <Typography variant="h2">
      {userDetails && `${userDetails.first_name} ${userDetails.last_name}`}
    </Typography>
    {/* map user fields to text display lines */}
    {userFields && userFields.map((field, index) => (
      <Typography 
        key={index} 
        className="user-detail-text"
        sx={{marginBottom: '16px'}}
      >
        <span className="user-detail-label"> {field.label}: </span> {field.value}
      </Typography>
    ))}
    {/* go to Photos */}
    {userDetails && (
      <Button variant="contained" component={Link} to={`/photos/${userDetails._id}`} sx={{marginTop: '10px'}}>
        View Photos
      </Button>
    )}

    {/* Most Recent Photo */}
    {mostRecentPhoto && (
      <Paper elevation={3} style={{ padding: "20px", marginTop: "20px", backgroundColor: "#f9f9f9", display: "flex", flexDirection: "column", alignItems: "center"}}>
        <Typography variant="body2" sx={{fontSize: "30px", marginBottom: "20px"}}>
          Most Recent Photo
        </Typography>
        <Link to={`/photos/${mostRecentPhoto.user_id}`}>
          <img
            src={`/images/${mostRecentPhoto.file_name}`}
            style={{
              width: "100px",
              height: "100px",
              objectFit: "cover",
            }}
          />
        </Link>
        <Typography variant="body1" sx={{fontSize: "20px", marginTop: "20px"}}>
            <strong>Date Uploaded:</strong> {new Date(mostRecentPhoto.date_time).toLocaleString()}
            {/* make sure to handle case where new user has no photos */}
        </Typography>
      </Paper>
    )}

    {/* Most commented photo */}
    {mostCommentedPhoto && (
      <Paper elevation={3} style={{ padding: "20px", marginTop: "20px", backgroundColor: "#f9f9f9", display: "flex", flexDirection: "column", alignItems: "center"}}>
        <Typography variant="body2" sx={{fontSize: "30px", marginBottom: "20px"}}>
          Photo with Most Comments
        </Typography>
        <Link to={`/photos/${mostCommentedPhoto.user_id}`}>
          <img
            src={`/images/${mostCommentedPhoto.file_name}`}
            style={{
              width: "100px",
              height: "100px",
              objectFit: "cover",
            }}
          />
        </Link>
        <Typography variant="body1" sx={{fontSize: "20px", marginTop: "20px"}}>
            <strong>Comment count:</strong> {mostCommentedPhoto.commentCount === 0 ? "No comments yet" : mostCommentedPhoto.commentCount}
        </Typography>
      </Paper>
    )}

    {/* Mentions */}
    <Paper elevation={3} style={{ padding: "20px", marginTop: "20px", backgroundColor: "#f9f9f9", display: "flex", flexDirection: "column", alignItems: "center"}}>
      <Typography variant="body2" sx={{fontSize: "30px", marginTop: "20px", marginBottom: "20px"}}>Mentions</Typography>
      {isLoading && <p>Loading...</p>}
      {!isLoading && noMentionsMessage && <Typography variant="body1">{noMentionsMessage}</Typography>}
      {!isLoading && thumbnailPhotos && (
          <div className="mentions-box">
            {thumbnailPhotos.map((photo) => (
              <div key={photo.photo_id}>
                {/* Image Thumbnail */}
                <Link to={`/photos/${photo.user_id}#photo-${photo.photo_id}`}>
                  <img
                    src={`/images/${photo.file_name}`}
                    alt={photo.user_name}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </Link>  
                {/* User Name Link */}
                <Typography variant="body1"
                component={Link} to={`/users/${photo.user_id}`}
                style={{display: 'block', marginTop: "10px", marginBottom: "10px", fontSize: "16px"}}
                >
                  {photo.user_name}
                </Typography>          
              </div>
            ))}
          </div>
      )}
    </Paper>
    </div>
  );
}

export default UserDetail;
