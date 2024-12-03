import React, {useState, useEffect} from "react";
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import axios from 'axios';
import "./styles.css";

function UserList() {

  // fetch list of users
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch the user list on component mount
    axios.get("/user/list")
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user list:", error);
      });
  }, []);

  return (
    <div>
      <Typography variant="h4" sx={{marginLeft: '16px'}}>
        Users
      </Typography>
      <List component="nav">
        {users && users.map((user) => (
            <React.Fragment key={user._id}>
              <ListItem component={Link} to={`/users/${user._id}`}>
                <ListItemText primary={`${user.first_name} ${user.last_name}`}/>
              </ListItem>
              <Divider />
            </React.Fragment>
        ))}
      </List>
    </div>
  );
}

export default UserList;
