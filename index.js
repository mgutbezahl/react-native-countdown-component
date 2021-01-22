import React, { useCallback, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  AppState,
} from 'react-native';
import _ from 'lodash';
import moment from 'moment';
import BackgroundTimer from 'react-native-background-timer';

const DEFAULT_DIGIT_STYLE = { backgroundColor: '#FAB913' };
const DEFAULT_DIGIT_TXT_STYLE = { color: '#000' };
const DEFAULT_TIME_LABEL_STYLE = { color: '#000' };
const DEFAULT_SEPARATOR_STYLE = { color: '#000' };
const DEFAULT_TIME_TO_SHOW = ['D', 'H', 'M', 'S'];
const DEFAULT_TIME_LABELS = {
  d: 'Days',
  h: 'Hours',
  m: 'Minutes',
  s: 'Seconds',
};

const INITIALIZE_DIFF = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalSeconds: 0,
};

function CountDown(props) {
  const { until, useBackgroundTimer, running, onFinish, onChange } = props;
  const intervalId = useRef(null);
  const secondInterval = useRef(0);
  const [duration, setDuration] = useState(INITIALIZE_DIFF);

  const initInterval = useCallback(() => {
    const untilMoment = moment(until);
    const currentMoment = moment();
    secondInterval.current = untilMoment.diff(currentMoment, 'seconds');
  }, [until]);

  const updateDuration = useCallback(() => {
    let diff = INITIALIZE_DIFF;
    const seconds = secondInterval.current;
    if (seconds > 0) {
      const untilMoment = moment(until);
      const currentMoment = moment(moment().format());
      diff = {
        days: untilMoment.diff(currentMoment, 'days'),
        hours: parseInt(seconds / 3600, 10) % 24,
        minutes: parseInt(seconds / 60, 10) % 60,
        seconds: seconds % 60,
        totalSeconds: seconds,
      };
    }
    setDuration(diff);
    return diff;
  }, [until])

  const setTick = useCallback(
    callback => {
      clearTick();
      if (useBackgroundTimer) {
        intervalId.current = BackgroundTimer.setInterval(() => {
          callback();
        }, 1000);
      } else {
        intervalId.current = setInterval(() => {
          callback();
        }, 1000);
      }
    },
    [clearTick, useBackgroundTimer],
  );

  const clearTick = useCallback(() => {
    if (intervalId.current) {
      if (useBackgroundTimer) {
        BackgroundTimer.clearInterval(intervalId.current);
      } else {
        clearInterval(intervalId.current);
      }
      intervalId.current = null;
    }
  }, [useBackgroundTimer]);

  const updateTimer = useCallback(() => {
    if (!until && !running) {
      return;
    }
    secondInterval.current = Math.max(0, secondInterval.current - 1);
    const currentDuration = updateDuration();
    if (_.isFunction(onChange)) {
      onChange(currentDuration);
    }
    if (currentDuration.totalSeconds <= 0 && _.isFunction(onFinish)) {
      onFinish();
      clearTick();
    }
  }, [until, running, updateDuration, clearTick]);

  React.useEffect(() => {
    if (!until && !running) {
      return;
    }
    const handleAppStateChange = currentAppState => {
      initInterval();
      updateDuration();
      if (currentAppState === 'active' && running) {
        setTick(updateTimer);
      }
      if (currentAppState === 'background') {
        clearTick();
      }
    };

    setTick(updateTimer);
    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearTick();
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [until, running, useBackgroundTimer]);

  React.useEffect(() => {
    if (!until) {
      return;
    }
    initInterval();
    updateDuration();
  }, [until]);

  const renderSeparator = () => {
    const { separatorStyle, size } = props;
    return (
      // eslint-disable-next-line react-native/no-inline-styles
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={[
            styles.separatorTxt,
            { fontSize: size * 1.2 },
            separatorStyle,
          ]}>
          {':'}
        </Text>
      </View>
    );
  };

  const renderLabel = label => {
    const { timeLabelStyle, size } = props;
    if (label) {
      return (
        <Text
          style={[styles.timeTxt, { fontSize: size / 1.8 }, timeLabelStyle]}>
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
        ]}>
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

  const renderCountDown = () => {
    const { timeToShow, timeLabels, showSeparator } = props;
    const newTime = [
      ('0' + duration.days).slice(-2),
      ('0' + duration.hours).slice(-2),
      ('0' + duration.minutes).slice(-2),
      ('0' + duration.seconds).slice(-2),
    ];
    const Component = props.onPress ? TouchableOpacity : View;

    return (
      <Component style={styles.timeCont} onPress={props.onPress}>
        {timeToShow.includes('D')
          ? renderDoubleDigits(timeLabels.d, newTime[0])
          : null}
        {showSeparator && timeToShow.includes('D') && timeToShow.includes('H')
          ? renderSeparator()
          : null}
        {timeToShow.includes('H')
          ? renderDoubleDigits(timeLabels.h, newTime[1])
          : null}
        {showSeparator && timeToShow.includes('H') && timeToShow.includes('M')
          ? renderSeparator()
          : null}
        {timeToShow.includes('M')
          ? renderDoubleDigits(timeLabels.m, newTime[2])
          : null}
        {showSeparator && timeToShow.includes('M') && timeToShow.includes('S')
          ? renderSeparator()
          : null}
        {timeToShow.includes('S')
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
  until: null,
  size: 15,
  running: true,
  useBackgroundTimer: false,
};

CountDown.propTypes = {
  id: PropTypes.string,
  useBackgroundTimer: PropTypes.bool,
  digitStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  digitTxtStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  timeLabelStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  separatorStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  timeToShow: PropTypes.array,
  showSeparator: PropTypes.bool,
  size: PropTypes.number,
  until: PropTypes.instanceOf(Date),
  onChange: PropTypes.func,
  onPress: PropTypes.func,
  onFinish: PropTypes.func,
};

const styles = StyleSheet.create({
  timeCont: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timeTxt: {
    color: 'white',
    marginVertical: 2,
    backgroundColor: 'transparent',
  },
  timeInnerCont: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitCont: {
    borderRadius: 5,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleDigitCont: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitTxt: {
    color: 'white',
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  separatorTxt: {
    backgroundColor: 'transparent',
    fontWeight: 'bold',
  },
});

export default CountDown;
export { CountDown };
