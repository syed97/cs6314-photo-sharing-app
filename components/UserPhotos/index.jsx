import React, {useState, useContext, useEffect} from "react";
import { Typography, List, ListItem, Button} from "@mui/material";
import { Link } from "react-router-dom";
import { MentionsInput, Mention } from 'react-mentions';
import axios from 'axios';
import { LoginContext } from "../../context/LoginContext";

import "./styles.css";

function UserPhotos({userId}) {
  const {loginId} = useContext(LoginContext); // for login state
  const [userPhotos, setUserPhotos] = useState(null); // for fetching photos
  const [commentValues, setCommentValues] = useState({}); // for display in the text field - Keyed by photoId
  const [commentTextsToSubmit, setcommentTextsToSubmit] = useState({}); // plain text submission as comment - keyed by photoid
  const [users, setUsers] = useState([]); // to store users for @ mentions
  /* object w/ photoId as key and array of mentions as value
  {
    123: [
      { id: 'user1', display: 'John Doe' },
      { id: 'user2', display: 'Jane Smith' }
    ],
    456: [
      { id: 'user3', display: 'Alice Johnson' }
    ]
  } */
  const [mentionsList, setMentionsList] = useState({});


  useEffect(() => {
    axios.get(`/photosOfUser/${userId}`)
      .then((response) => {
        // Filter out deleted photos and comments
        const filteredPhotos = response.data
        .filter((photo) => !photo.is_delete) // Include only photos where is_delete is false
        .map((photo) => ({
          ...photo,
          comments: photo.comments.filter((comment) => !comment.is_delete), // Filter comments within each photo
        }));
        setUserPhotos(filteredPhotos);
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  }, [userId]);

  // get user list for mentions data
  useEffect(() => {
    axios.get("/user/list")
    .then((response) => {
      const formattedUsers = response.data.map(person => ({
        id: `${person._id}`, // or any unique identifier
        display: `${person.first_name} ${person.last_name}`,
      }));
      setUsers(formattedUsers);
    })
    .catch((error) => {
      console.error("Error fetching user list:", error);
    });
  }, []);

  // Handle comment change in text field
  const handleCommentChange = (event, photoId, newValue, plainTextValue, mentions) => {
    // set display text
    setCommentValues((prev) => ({
      ...prev,
      [photoId]: newValue, // Update the comment text for the specific photo
    }));

    // set comment text for submission
    setcommentTextsToSubmit((prev) => ({
      ...prev,
      [photoId]: plainTextValue, // Update the comment text for the specific photo
    }));

    // Filter out duplicate mentions (same user_id)
    const uniqueMentions = mentions.filter((mention, index, self) => (
      index === self.findIndex((m) => m.id === mention.id)
    ));

    // set mentions list with unique mentions
    setMentionsList((prev) => ({
      ...prev,
      [photoId]: uniqueMentions // Update mentions for the specific photo without duplicates
    }));

  };

  // Handle submitting a new comment
  const handleAddComment = (photoId) => {
    const commentText = commentTextsToSubmit[photoId];
    if (!commentText || commentText.trim().length === 0) {
      return;  // If comment is empty, do nothing
    }

    let mentionedUsers = [...mentionsList[photoId]];

    // fit format of mentionedUsers to fit mention schema in backend
    const mentionedUsersMapped = mentionedUsers.map((user) => ({
      user_id: user.id,
      display_name: user.display
    }));

    // Send the new comment to the backend
    axios
      .post(`/commentsOfPhoto/${photoId}`, { comment: commentText, mentions: mentionedUsersMapped })
      .then((response) => {
        // On success, update the photo's comments in the state
        setUserPhotos((prevPhotos) => prevPhotos.map((photo) => {
            if (photo._id === photoId) {
              return { ...photo, comments: [...photo.comments, response.data] };
            }
            return photo;
          })
        );

        // clear states
        setCommentValues((prev) => ({
          ...prev,
          [photoId]: "",
        }));

        setcommentTextsToSubmit((prev) => ({
          ...prev,
          [photoId]: "", 
        }));

        setMentionsList((prev) => ({
          ...prev,
          [photoId]: [],
        }));


      })
      .catch((error) => {
        console.error("Error adding comment:", error);
      });
  };

  // Delete a photo
  const handleDeletePhoto = (photo_id) => {
    axios.delete(`/photo/${photo_id}`)
      .then(() => {
        setUserPhotos((prevPhotos) => prevPhotos.filter((photo) => photo._id !== photo_id));
      })
      .catch((error) => {
        console.error("Error deleting photo:", error);
      });
  };

  // Delete a comment
  const handleDeleteComment = (photo_id, comment_id) => {
    axios
      .delete(`/comment/${comment_id}`)
      .then(() => {
        setUserPhotos((prevPhotos) => (prevPhotos.map((photo) => {
            if (photo._id === photo_id) {
              return {
                ...photo,
                comments: photo.comments.filter(
                  (comment) => comment._id !== comment_id
                ),
              };
            }
            return photo;
          }))
        );
      })
      .catch((error) => {
        console.error("Error deleting comment:", error);
      });
  };


  // for scrolling to specific photo
  useEffect(() => {
    if (userPhotos) {
      const mainHash = window.location.hash;
      const hash = "#" + mainHash.split('#').slice(-1);
      if (hash) {
        const elementId = hash.replace('#photo-', '');
        const element = document.getElementById(`photo-${elementId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        // Reset the URL to remove the hash
        // Find the index of the second hash
        const url = window.location.href;
        const secondHashIndex = url.indexOf('#', url.indexOf('#') + 1);

        // Remove the part after the second hash
        const updatedUrl = secondHashIndex !== -1 ? url.substring(0, secondHashIndex) : url;
        window.history.replaceState(null, null, updatedUrl);
      }
    } 
  }, [userPhotos]);
  


  return (
    <div className="photo-main-div">
      {userPhotos && userPhotos.map((photo) => (
        // item container
        <div key={photo._id} id={`photo-${photo._id}`} className="photo-item-div">
          {/* photo */}
          <img src={`/images/${photo.file_name}`}/>
          {/* Delete photo button (only for logged in user's own photos) */}
          {photo.user_id === loginId && (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleDeletePhoto(photo._id)}
                style={{marginTop: "20px"}}
              >
                Delete Photo
              </Button>
            )}
          {/* creation date */}
          <div className="photo-creation-date-div">
            <p>Photo taken on: {new Date(photo.date_time).toLocaleString()}</p>
          </div>
          {/* comments */}
          {photo.comments && photo.comments.length > 0 ? (
            // individual comment object
            <List>
              {photo.comments.map((comment) => (
                <ListItem 
                  key={comment._id} 
                  sx={{display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      justifyContent: ''}}
                >
                  {/* user name and comment */}
                  <Typography variant="body1" sx={{width: '500px'}}>
                    <Link to={`/users/${comment.user._id}`} >
                      <strong>{comment.user.first_name} {comment.user.last_name}: </strong>
                    </Link>
                    {comment.comment}
                  </Typography>
                  {/* comment date */}
                  <Typography variant="body2" color="textSecondary">
                    Posted on: {new Date(comment.date_time).toLocaleString()}
                  </Typography>
                  {/* Delete photo button (only for logged in user's own photos) */}
                  {comment.user._id === loginId && (
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleDeleteComment(photo._id, comment._id)}
                        style={{marginTop: "20px"}}
                      >
                        Delete Comment
                      </Button>
                    )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No comments yet.
            </Typography>
          )}

          {/* Add comment section */}
          <div className="new-comment-box">
            <MentionsInput
                value={commentValues[photo._id] || ""}
                onChange={(event, newValue, plainTextValue, mentions) => (
                  handleCommentChange(event, photo._id, newValue, plainTextValue, mentions))}                
                className="mentions"
                placeholder="Add a comment"
              >
                <Mention
                  trigger="@"
                  data={users}
                  displayTransform={(id, display) => `@${display}`}
                />
            </MentionsInput>

            <Button
              variant="contained"
              color="primary"
              onClick={() => handleAddComment(photo._id)}
              sx={{ marginBottom: "20px"}}
            >
              Post
            </Button>
          </div>

        </div>
      ))}
    </div>
  );
}

export default UserPhotos;
