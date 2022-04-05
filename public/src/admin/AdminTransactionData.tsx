import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { auth } from "../firebase/firebaseInit";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { getDateFromNumber } from "../utils/utilFunctions";
import { Timestamp } from "@firebase/firestore";

const AdminTransactionData = () => {
  const [cardOpen, setCardOpen] = useState(false);

  const [data, setData] = useState([] as ITransaction[]);
  const [nEntries, setNEntries] = useState(5);

  const handleGetTransactionData = async () => {
    auth.currentUser.getIdToken().then((userTokenId) => {
      const options = {
        method: "GET",
      };

      fetch(`/transaction-data/${userTokenId}?n=${nEntries}`, options)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.statusCode === 200) {
            const data = resData.data;
            const keys = Object.keys(data);
            const arr = [];
            for (let key of keys) {
              arr.push(data[key]);
            }

            // arr.sort((a: ITransaction, b: ITransaction) =>
            //   a.date < b.date ? 1 : -1
            // );
            // console.log("transaction arr", arr, resData);

            setData(arr);
          } else if (resData.statusCode === 403) {
            toast.error("Unauthorized user");
            window.location.href = "/";
          }
        });
    });
  };

  return (
    <Grid item xs={12}>
      <Card>
        <CardHeader
          header="Transaction data"
          title="Transaction data"
          subheader="See data about the transaction"
          action={
            <IconButton onClick={() => setCardOpen(!cardOpen)}>
              {cardOpen ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
        />

        <CardContent>
          <Collapse in={cardOpen}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography>
                  Created Rooms fetched: {data?.length ?? "-"}{" "}
                </Typography>
              </Grid>
              <Grid item xs={4} sm={3}>
                <Typography>If not positive then will get all data</Typography>
              </Grid>
              <Grid item xs={4} sm={3}>
                <TextField
                  type="number"
                  value={nEntries ? nEntries : ""}
                  onChange={(e) => setNEntries(+e.target.value)}
                />
              </Grid>
              <Grid item xs={4} sm={3}>
                <Button
                  disableElevation
                  variant="contained"
                  onClick={() => handleGetTransactionData()}
                >
                  Get transaction data
                </Button>
              </Grid>
              <Grid item xs={false} sm={3} />

              <Grid item xs={12}>
                <TransactionDataTable data={data} />
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default AdminTransactionData;

interface ITransaction {
  date: Timestamp;
  id: string;
  cost: number;
}

interface ITransactionDataTable {
  data: ITransaction[];
}

const TransactionDataTable = (props: ITransactionDataTable) => {
  return (
    <TableContainer
      component={Paper}
      style={{
        // backgroundColor: inputBackgroundColor,
        boxShadow: "none",
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell component="th">Date</TableCell>
            <TableCell component="th">Id</TableCell>
            <TableCell component="th">Cost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.data.map((d) => (
            <TableRow key={d.date.seconds + d.id}>
              <TableCell>{getDateFromNumber(d.date.seconds * 1000)}</TableCell>
              <TableCell>{d.id}</TableCell>
              <TableCell>{d.cost}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
