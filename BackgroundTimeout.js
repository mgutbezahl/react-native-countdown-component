import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';

function BackgroundTimeout(props) {
  const { seconds, useBackgroundTimer, onFinish, onChange } = props;
  const intervalId = useRef(null);
  const originalTime = useRef(null);
  const secondInterval = useRef(0);

  const initInterval = useCallback(() => {
    if (!seconds || seconds <= 0) {
      return;
    }
    const untilMoment = moment(originalTime.current);
    const currentMoment = moment(moment().format());
    secondInterval.current = untilMoment.diff(currentMoment, 'seconds');
  }, [seconds]);

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
    if (!seconds || seconds <= 0) {
      return;
    }
    secondInterval.current = Math.max(0, secondInterval.current - 1);
    if (_.isFunction(onChange)) {
      onChange(secondInterval.current);
    }
    if (secondInterval.current <= 0 && _.isFunction(onFinish)) {
      onFinish();
      clearTick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, clearTick]);

  React.useEffect(() => {
    if (!seconds || seconds <= 0) {
      return;
    }
    const handleAppStateChange = currentAppState => {
      initInterval();
      if (currentAppState === 'active') {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, useBackgroundTimer]);

  React.useEffect(() => {
    if (!seconds || seconds <= 0) {
      return;
    }
    originalTime.current = moment(moment().format())
      .add(seconds, 'second')
      .toDate();
    initInterval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  return null;
}

BackgroundTimeout.defaultProps = {
  seconds: 0,
  useBackgroundTimer: false,
};

BackgroundTimeout.propTypes = {
  useBackgroundTimer: PropTypes.bool,
  seconds: PropTypes.number,
  onChange: PropTypes.func,
  onFinish: PropTypes.func,
};

export default BackgroundTimeout;
export { BackgroundTimeout };
