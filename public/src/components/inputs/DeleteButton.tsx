import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import { basicColor, cardBackgroundColor } from "../../providers/theme";
import { CircularProgress } from "@mui/material";

interface IDeleteButton {
  onDelete: () => void;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 300,
  bgcolor: cardBackgroundColor,
  // border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const DeleteButton = (props: IDeleteButton) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <React.Fragment>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography id="modal-modal-title" variant="h6" component="h2">
                Are sure you want to delete?
              </Typography>
            </Grid>
            {isLoading ? (
              <Grid item xs={12}>
                <CircularProgress />
              </Grid>
            ) : (
              <>
                <Grid item xs={6}>
                  <Button
                    onClick={() => setOpen(false)}
                    variant="contained"
                    disableElevation
                    style={{ backgroundColor: basicColor, color: "black" }}
                  >
                    Cancel
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    disabled={isLoading}
                    variant="contained"
                    color="error"
                    onClick={() => {
                      setIsLoading(true);
                      props.onDelete();
                    }}
                  >
                    Delete
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </Modal>
      <Button
        color="error"
        variant="outlined"
        onClick={() => setOpen(true)}
        endIcon={<DeleteIcon />}
      >
        Delete
      </Button>
    </React.Fragment>
  );
};

export default DeleteButton;
