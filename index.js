import React from "react";
import PropTypes from "prop-types";

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  AppState,
} from "react-native";
import _ from "lodash";
import { sprintf } from "sprintf-js";
import BackgroundTimer from "react-native-background-timer";

BackgroundTimer.start();

const DEFAULT_DIGIT_STYLE = { backgroundColor: "#FAB913" };
const DEFAULT_DIGIT_TXT_STYLE = { color: "#000" };
const DEFAULT_TIME_LABEL_STYLE = { color: "#000" };
const DEFAULT_SEPARATOR_STYLE = { color: "#000" };
const DEFAULT_TIME_TO_SHOW = ["D", "H", "M", "S"];
const DEFAULT_TIME_LABELS = {
  d: "Days",
  h: "Hours",
  m: "Minutes",
  s: "Seconds",
};

function CountDown(props) {
  const getDuration = () => {
    return Math.max(parseInt((props.until - Date.now()) / 1000, 10), 0);
  };
  const [duration, setDuration] = React.useState(getDuration());
  const durationRef = React.useRef(duration);
  const intervalId = React.useRef('');

  const updateCurrentDuration = () => {
    const currentDuration = getDuration();
    setDuration(currentDuration);
    durationRef.current = currentDuration;
  };

  React.useEffect(() => {
    intervalId.current = BackgroundTimer.setInterval(() => {
      updateTimer();
    }, 1000);

    const handleAppStateChange = (currentAppState) => {
      if (currentAppState === "active" && props.running) {
        updateCurrentDuration();
        intervalId.current = BackgroundTimer.setInterval(() => {
          updateTimer();
        }, 1000);
      }
      if (currentAppState === "background") {
        BackgroundTimer.clearInterval(intervalId.current);
      }
    };

    AppState.addEventListener("change", handleAppStateChange);
    return () => {
      BackgroundTimer.clearInterval(intervalId);
      AppState.removeEventListener("change", handleAppStateChange);
    };
  }, [props.id, props.until]);

  React.useEffect(() => {
    updateCurrentDuration();
  }, [props.id, props.until]);

  React.useEffect(() => {
    if(duration <= 0) {
      BackgroundTimer.clearInterval(intervalId.current);
      durationRef.current = 0;
      setDuration(0);
    }
  }, [duration]);

  const updateTimer = () => {
    if (!props.running) {
      return;
    }
    durationRef.current -= 1;
    const currentDuration = durationRef.current;
    if (currentDuration === 0) {
      if (props.onFinish) {
        props.onFinish();
      }
      setDuration(0);
    } else {
      setDuration(currentDuration);
    }
    if (props.onChange) {
      props.onChange(currentDuration);
    }
  };

  const renderSeparator = () => {
    const { separatorStyle, size } = props;
    return (
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <Text
          style={[
            styles.separatorTxt,
            { fontSize: size * 1.2 },
            separatorStyle,
          ]}
        >
          {":"}
        </Text>
      </View>
    );
  };

  const renderLabel = (label) => {
    const { timeLabelStyle, size } = props;
    if (label) {
      return (
        <Text
          style={[styles.timeTxt, { fontSize: size / 1.8 }, timeLabelStyle]}
        >
          {label}
        </Text>
      );
    }
  };

  const renderDigit = (d, label) => {
    const { digitStyle, digitTxtStyle, size } = props;
    return (
      <View
        style={[
          styles.digitCont,
          { width: size * 2.3, height: size * 2.6 },
          digitStyle,
        ]}
      >
        <Text style={[styles.digitTxt, { fontSize: size }, digitTxtStyle]}>
          {d}
        </Text>
        {renderLabel(label)}
      </View>
    );
  };

  const renderDoubleDigits = (label, digits) => {
    return (
      <View style={styles.doubleDigitCont}>
        <View style={styles.timeInnerCont}>{renderDigit(digits, label)}</View>
      </View>
    );
  };

  const getTimeLeft = () => {
    return {
      seconds: duration % 60,
      minutes: parseInt(duration / 60, 10) % 60,
      hours: parseInt(duration / (60 * 60), 10) % 24,
      days: parseInt(duration / (60 * 60 * 24), 10),
    };
  };

  const renderCountDown = () => {
    const { timeToShow, timeLabels, showSeparator } = props;
    const { days, hours, minutes, seconds } = getTimeLeft();
    const newTime = sprintf(
      "%02d:%02d:%02d:%02d",
      days,
      hours,
      minutes,
      seconds
    ).split(":");
    const Component = props.onPress ? TouchableOpacity : View;

    return (
      <Component style={styles.timeCont} onPress={props.onPress}>
        {timeToShow.includes("D")
          ? renderDoubleDigits(timeLabels.d, newTime[0])
          : null}
        {showSeparator && timeToShow.includes("D") && timeToShow.includes("H")
          ? renderSeparator()
          : null}
        {timeToShow.includes("H")
          ? renderDoubleDigits(timeLabels.h, newTime[1])
          : null}
        {showSeparator && timeToShow.includes("H") && timeToShow.includes("M")
          ? renderSeparator()
          : null}
        {timeToShow.includes("M")
          ? renderDoubleDigits(timeLabels.m, newTime[2])
          : null}
        {showSeparator && timeToShow.includes("M") && timeToShow.includes("S")
          ? renderSeparator()
          : null}
        {timeToShow.includes("S")
          ? renderDoubleDigits(timeLabels.s, newTime[3])
          : null}
      </Component>
    );
  };
  return <View style={props.style}>{renderCountDown()}</View>;
}

CountDown.defaultProps = {
  digitStyle: DEFAULT_DIGIT_STYLE,
  digitTxtStyle: DEFAULT_DIGIT_TXT_STYLE,
  timeLabelStyle: DEFAULT_TIME_LABEL_STYLE,
  timeLabels: DEFAULT_TIME_LABELS,
  separatorStyle: DEFAULT_SEPARATOR_STYLE,
  timeToShow: DEFAULT_TIME_TO_SHOW,
  showSeparator: false,
  until: 0,
  size: 15,
  running: true,
};

CountDown.propTypes = {
  id: PropTypes.string,
  digitStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  digitTxtStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  timeLabelStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  separatorStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  timeToShow: PropTypes.array,
  showSeparator: PropTypes.bool,
  size: PropTypes.number,
  until: PropTypes.number,
  onChange: PropTypes.func,
  onPress: PropTypes.func,
  onFinish: PropTypes.func,
};

const styles = StyleSheet.create({
  timeCont: {
    flexDirection: "row",
    justifyContent: "center",
  },
  timeTxt: {
    color: "white",
    marginVertical: 2,
    backgroundColor: "transparent",
  },
  timeInnerCont: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  digitCont: {
    borderRadius: 5,
    marginHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  doubleDigitCont: {
    justifyContent: "center",
    alignItems: "center",
  },
  digitTxt: {
    color: "white",
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  separatorTxt: {
    backgroundColor: "transparent",
    fontWeight: "bold",
  },
});

export default CountDown;
export { CountDown };
