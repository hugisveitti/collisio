import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Typography } from "@mui/material";
import Collapse from "@mui/material/Collapse";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  activeRaceTrackNames,
  activeTagTrackNames,
  getTrackInfo,
} from "../../classes/Game";
import {
  buyItem,
  getOwnership,
} from "../../firebase/firestoreOwnershipFunctions";
import { getStyledColors } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import { ITokenData } from "../../shared-backend/medalFuncions";
import {
  allCosts,
  AllOwnership,
  getDefaultOwnership,
} from "../../shared-backend/ownershipFunctions";
import {
  allTrackNames,
  GameType,
  ITrackInfo,
  TrackName,
} from "../../shared-backend/shared-stuff";
import { itemInArray } from "../../utils/utilFunctions";
import BackdropButton from "../button/BackdropButton";
import BuyItemComponent from "../garage/BuyItemComponent";
import "../inputs/select.css";
import { loginPagePath } from "../Routes";
import { IStore } from "../store";
import TokenComponent from "../tokenComponent/TokenComponent";
import TrackItems, { getTrackLargeImage } from "./TrackItems";

interface ITrackSelect {
  gameType: GameType;
  excludedTracks: TrackName[];
  onChange: (trackName: TrackName) => void;
  value: TrackName;
  showMapPreview?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  simpleSelect?: boolean;
  store?: IStore;
  buttonToOpen?: boolean;
}

const TrackSelect = (props: ITrackSelect) => {
  const user = useContext(UserContext);
  const [showLargeContainer, setShowLargeContainer] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(props.value);
  const [isBuying, setIsBuying] = useState(false);

  const [ownership, setOwnership] = useState(
    undefined as undefined | AllOwnership
  );

  useEffect(() => {
    if (user?.uid) {
      getOwnership(user.uid)
        .then((_ownership) => {
          setOwnership(_ownership);
        })
        .catch(() => {
          console.warn("Error getting ownership");
        });
    } else {
      setOwnership(getDefaultOwnership());
    }
  }, [user]);

  const trackOptions: ITrackInfo[] = [];
  for (let track of allTrackNames) {
    if (
      track.gameType === props.gameType &&
      !itemInArray(track.type, props.excludedTracks)
    ) {
      trackOptions.push(track);
    }
  }

  const { color, backgroundColor } = getStyledColors("white");

  if (props.simpleSelect || !props.store) {
    return (
      <React.Fragment>
        <span className="select__label" style={{ color: backgroundColor }}>
          Track
        </span>
        <FormControl fullWidth={props.fullWidth} disabled={props.disabled}>
          <Select
            className="select"
            style={{
              backgroundColor,
              color,
              minWidth: 200,
            }}
            name="vehicle"
            onChange={(e) => {
              props.onChange(e.target.value as TrackName);
            }}
            value={props.value}
          >
            {trackOptions.map((vehicle) => (
              <MenuItem key={vehicle.type} value={vehicle.type}>
                {vehicle.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </React.Fragment>
    );
  }

  let largeImage = getTrackLargeImage(selectedTrack);

  const handleBuyTrack = (trackName: TrackName) => {
    if (!user) {
      toast.error("Only logged in players can buy tracks.");
      return;
    }
    setIsBuying(true);
    buyItem(user.uid, trackName).then((data) => {
      if (data.completed) {
        toast.success(data.message);
        const newOwnership = {
          ...ownership,
        };
        newOwnership[trackName] = true;
        setOwnership(newOwnership);

        const newTokenData: ITokenData = {
          ...props.store.tokenData,
          coins: props.store.tokenData.coins - allCosts[trackName],
        };
        props.store.setTokenData(newTokenData);

        props.onChange(trackName);
      } else {
        toast.error(data.message);
      }
      setIsBuying(false);
    });
  };

  const renderOwnership = () => {
    if (!ownership) return null;

    const trackInfo = getTrackInfo(selectedTrack);

    return (
      <BuyItemComponent
        notAfford={allCosts[selectedTrack] > props.store.tokenData?.coins}
        loading={isBuying}
        cost={allCosts[selectedTrack]}
        label={
          <div>
            <div style={{ fontSize: 20, marginBottom: 10 }}>
              {trackInfo.name}
            </div>
            <span>Difficulty {trackInfo.difficulty}</span>
          </div>
        }
        onBuy={() => {
          handleBuyTrack(selectedTrack);
        }}
        owned={ownership[selectedTrack]}
        buyButtonText="track"
      />
    );
  };

  const renderLargeTrackSelect = () => {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} md={6}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              {!!user ? (
                <TokenComponent user={user} store={props.store} />
              ) : (
                <div className="background">
                  <Typography>
                    You need to be logged in to buy tracks.
                  </Typography>
                  <BackdropButton link={loginPagePath}>Login</BackdropButton>
                </div>
              )}
            </Grid>
            <Grid item xs={12}>
              {renderOwnership()}
            </Grid>
            <Grid item xs={12}>
              <div>
                {largeImage ? (
                  <img style={{ maxWidth: "100%" }} src={largeImage} />
                ) : (
                  <p>No preview available</p>
                )}
              </div>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <TrackItems
            loggedIn={!!user}
            ownership={ownership}
            tracks={
              props.gameType === "race"
                ? activeRaceTrackNames
                : activeTagTrackNames
            }
            onChange={(trackName) => {
              setSelectedTrack(trackName);
              if (ownership[trackName]) {
                props.onChange(trackName);
              }
            }}
            selectedTrack={selectedTrack}
          />
        </Grid>
      </Grid>
    );
  };

  if (!props.buttonToOpen) {
    return renderLargeTrackSelect();
  }
  return (
    <>
      <BackdropButton
        startIcon={showLargeContainer ? <ExpandLess /> : <ExpandMore />}
        onClick={() => setShowLargeContainer(!showLargeContainer)}
      >
        Track select
      </BackdropButton>
      <Collapse in={showLargeContainer}>{renderLargeTrackSelect()}</Collapse>
    </>
  );
};

export default TrackSelect;
