import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import RtcEngine from 'react-native-agora';
import { requestAudioPermission } from './permissions';

export const useRequestAudioHook = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Request required permissions from Android

      requestAudioPermission().then(() => {
        console.log('requested!');
      });
    }
  }, []);
};

export const useInitializeAgora = () => {
  // Replace yourAppId with the App ID of your Agora project.
  const appId = '7474aab9902548c4beddaff51c1f82d9';
  const token =
    '0066bb4e5cc2ba04652b76ba36a4b7b5ce6IABkVPtCpkjNEkV9DJO60ZxLuGq8iDC2cEIeKB1hxZNgp4a0dcYAAAAAEADr9jhXTbOMYAEAAQBNs4xg';

  const [channelName, setChannelName] = useState('my-channel');
  const [joinSucceed, setJoinSucceed] = useState(false);
  const [peerIds, setPeerIds] = useState([]);
  const [isMute, setIsMute] = useState(false);
  const [isSpeakerEnable, setIsSpeakerEnable] = useState(true);
  const rtcEngine = useRef(null);

  const initAgora = useCallback(async () => {
    rtcEngine.current = await RtcEngine.create(appId);

    await rtcEngine.current?.enableAudio();
    await rtcEngine.current?.muteLocalAudioStream(false);
    await rtcEngine.current?.setEnableSpeakerphone(true);

    rtcEngine.current?.addListener('UserJoined', (uid, elapsed) => {
      console.log('UserJoined', uid, elapsed);

      setPeerIds((peerIdsLocal) => {
        if (peerIdsLocal.indexOf(uid) === -1) {
          return [...peerIdsLocal, uid];
        }

        return peerIdsLocal;
      });
    });

    rtcEngine.current?.addListener('UserOffline', (uid, reason) => {
      console.log('UserOffline', uid, reason);

      setPeerIds((peerIdsLocal) => {
        return peerIdsLocal.filter((id) => id !== uid);
      });
    });

    rtcEngine.current?.addListener(
      'JoinChannelSuccess',
      (channel, uid, elapsed) => {
        console.log('JoinChannelSuccess', channel, uid, elapsed);

        setJoinSucceed(true);

        setPeerIds((peerIdsLocal) => {
          return [...peerIdsLocal, uid];
        });
      },
    );

    rtcEngine.current?.addListener('Error', (error) => {
      console.log('Join does not succeed', error);
    });
  }, []);

  const joinChannel = useCallback(async () => {
    await rtcEngine.current?.joinChannel(token, channelName, null, 0);
  }, [channelName]);

  const leaveChannel = useCallback(async () => {
    await rtcEngine.current?.leaveChannel();

    setPeerIds([]);
    setJoinSucceed(false);
  }, []);

  const toggleIsMute = useCallback(async () => {
    await rtcEngine.current?.muteLocalAudioStream(!isMute);
    setIsMute(!isMute);
  }, [isMute]);

  const toggleIsSpeakerEnable = useCallback(async () => {
    await rtcEngine.current?.setEnableSpeakerphone(!isSpeakerEnable);
    setIsSpeakerEnable(!isSpeakerEnable);
  }, [isSpeakerEnable]);

  const destroyAgoraEngine = useCallback(async () => {
    await rtcEngine.current?.destroy();
  }, []);

  useEffect(() => {
    initAgora();

    return () => {
      destroyAgoraEngine();
    };
  }, [destroyAgoraEngine, initAgora]);

  return {
    channelName,
    isMute,
    isSpeakerEnable,
    joinSucceed,
    peerIds,
    setChannelName,
    joinChannel,
    leaveChannel,
    toggleIsMute,
    toggleIsSpeakerEnable,
  };
};