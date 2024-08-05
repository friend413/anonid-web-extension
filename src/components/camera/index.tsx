import React, { useRef, useEffect, useState, ReactElement } from "react";

import { Modal, Button, Spin , Row, Col, Input } from "antd";
import Axios from 'axios';
// import FaceCam from "./FaceCam";
import { useWebcamContext } from "@src/hooks/useWebCam";
import { SpinWrapper, ModalContent } from "./cam.style";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import _debounce from "lodash/debounce";
import ReactBodymovin from "react-bodymovin";
import { AnimationWrapper } from "./cam.style";

import animation from "@src/utils/data/bodymovin-animation.json"
import {Notification} from '../notification';
import * as antdHelper from "../../utils/antd-helper";
import { Stream } from "stream";
interface Props {
    captureImage: () => void; // Update this based on actual function signature
    setCessAddr: (address: string, mnemonic: string) => void;
}
  
interface Resolution {
    width: number;
    height: number;
}

const CameraComp: React.FC<Props> = ({ captureImage, setCessAddr }): ReactElement => {
	// const { resolution, isDetected, WebCamRef} = useWebcamContext();
    const {
        resolution, WebcamStarted, setWebcamStarted, isDetected, setIsDetected,
        setWebCamRef, WebCamRef
    } = useWebcamContext(); // Ensure useWebcamContext returns correctly typed values

    const { width, height } = resolution;

    const webcamRef = useRef<Webcam | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const intervalId = useRef<number | null>(null);

    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
    const [isActiveButton, setIsActiveButton] = useState<boolean>(false);
    const [selectButton, setSelectButton] = useState<string | null>(null);
    const [recoveryKey, setRecoveryKey] = useState<string>("");
    const [isEnrollSpinActive, setEnrollSpinActive] = useState<boolean>(false);
    const [isVerifySpinActive, setVerifySpinActive] = useState<boolean>(false);
    const [isRecoverSpinActive, setRecoverSpinActive] = useState<boolean>(false);

    let intervalEnroll: NodeJS.Timeout | undefined = undefined;
    let intervalVerify: NodeJS.Timeout | undefined = undefined;
    let intervalRecover: NodeJS.Timeout | undefined = undefined;
    const intervalTime = 3000;

    let MainWidth = resolution.width;
    const widthCam = typeof window !== "undefined" ? window.innerWidth : 0;

    let View = { position: "absolute" } as React.CSSProperties;

    if (widthCam < 716) {
        MainWidth = width - 76;
    }

    if (widthCam < 400) {
        View = {
            ...View,
            width: "calc(100% - 41px)",
            height: "unset"
        };
    }

    const bodymovinOptions = {
        loop: true,
        autoplay: true,
        prerender: true,
        animationData: animation
    };

	const loadModels = async () => {
		try {
			const MODEL_URL = process.env.PUBLIC_URL + "/model/";
			await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
			console.log("Models loaded successfully");
			setIsModelLoaded(true);
		} catch (error) {
			console.error("Error loading models:", error);
			alert("Model was not loaded.");
		}
	};

	const handleWebcamStream = async () => {
		console.log('handlewebcamStream.................');
		if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4 && canvasRef.current) {
            setWebCamRef(webcamRef.current)
            const video = webcamRef.current.video;
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;
            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
            setTimeout(()=>{
                startFaceDetection(video, videoWidth, videoHeight)
            }, 1500)
		}
	  };

      const startFaceDetection = (video: HTMLVideoElement, videoWidth: number, videoHeight: number) => {
        console.log('detection');
        if (canvasRef.current) {
            const canvas = canvasRef.current;  // Direct reference to the canvas element
            const context = canvas.getContext("2d");
            intervalId.current = requestAnimationFrame(
                _debounce(async function detect() {
                    try {
                        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
                
                        if (detection) {
                            setIsDetected(true);
                            if (canvas.width > 0 && canvas.height > 0 && context) {
                                const resizedDetections = faceapi.resizeResults(detection, {
                                    width: videoWidth,
                                    height: videoHeight
                                });
                                context.clearRect(0, 0, videoWidth, videoHeight);
                                faceapi.draw.drawDetections(canvas, resizedDetections);  // Pass 'canvas' instead of 'context'
                            }
                        }
                    } catch (e) {
                        console.error('Error during face detection: ', e);
                    }
                    
                    intervalId.current = requestAnimationFrame(detect);
                }, 1000) // Debounce time in milliseconds
            );
        } else {
            console.log('canvas ref is null');
        }
    };
    


	const stopFaceDetection = () => {
		if (intervalId.current) {
			cancelAnimationFrame(intervalId.current);
		}
	};

	const enrollUser = () => {
		setSelectButton('enroll');
		setEnrollSpinActive(true);
		setVerifySpinActive(false);
		setRecoverSpinActive(false);
		if(!WebcamStarted) {
			setWebcamStarted(true);
		}
		intervalEnroll = setInterval(() => { enrollRequest() }, intervalTime);
	};
	
	const enrollRequest = () => {
		console.log('call create wallet func');
		const imgSrc = WebCamRef.getScreenshot();
		Axios.post(process.env.REACT_APP_SERVER_URL+"/create_wallet", {
			image: imgSrc
		}).then(res=>{
			console.log('res', res);
			if (res.status == 200) {
				const resStateText = res.data.status;
				if (resStateText == 'Success') {
					antdHelper.notiOK("Face Vector Read Successfully. Thanks for using Anon ID, no further action needed, verify at conference for access. ");
					clearInterval(intervalEnroll);
					
					setEnrollSpinActive(false);
				} else if (resStateText == "Error" ) {
					if (res.data.msg.includes("Dialog is closed")) {
						clearInterval(intervalEnroll);
						setEnrollSpinActive(false);
						return ;
					}
					antdHelper.noti(res.data.msg);
				} else if (resStateText == 'Already Exist') {
					antdHelper.noti('Face Vector Already Registered. Please Verify.');
					clearInterval(intervalEnroll);
					setEnrollSpinActive(false);

				} else if (resStateText == 'Move Closer') {
					antdHelper.noti('Please Move Closer!');
				} else if (resStateText == 'Go Back') {
					antdHelper.noti('Please Move Back!');
				} else if (resStateText == 'Liveness check failed') {
					antdHelper.noti('Liveness check failed!');
				} else if (resStateText == 'Face is too large'){
					antdHelper.noti('Face is too large.');
				} else if (resStateText == 'Spoof'){
					antdHelper.noti('Spoof Face');
				} else {
					console.log('Error');
				}
			} else {		
			}
		}).catch(err=>{
			console.log('err', err);
			antdHelper.noti('Server Error. Please contact dev team');
		})

	}
	const stopCamera = () => {
        if (webcamRef.current && webcamRef.current.video && canvasRef.current) {
            const stream = webcamRef.current.video.srcObject as MediaStream;
    
            if (stream) {
                const tracks = stream.getTracks();
                
                tracks.forEach(track => track.stop());
                webcamRef.current.video.srcObject = null;
                
                const context = canvasRef.current.getContext("2d");
                
                setIsDetected(false);
                setWebcamStarted(false);
                
                if (context)
                    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }
    

	const verifyUser = async () => {
		setSelectButton('verify');
		setVerifySpinActive(true);
		setEnrollSpinActive(false);
		setRecoverSpinActive(false);

		if(!WebcamStarted) {
			setWebcamStarted(true);
		}

		intervalVerify = setInterval(() => { verifyRequest() }, intervalTime);
	}

	const verifyRequest = () => {
		const imgSrc = WebCamRef.getScreenshot();
		Axios.post(process.env.REACT_APP_SERVER_URL+"/get_wallet", {
			image: imgSrc
		}).then(res=>{
			console.log('res', res);
			if (res.status == 200) {
				const resStateText = res.data.status;
				if (resStateText == 'Success') {
					antdHelper.notiOK("Face Vector verified Successfully.");
					clearInterval(intervalVerify);
					setCessAddr(res.data.address, res.data.mnemonic);
					setVerifySpinActive(false);
					_handleModalClose();
				} else if (resStateText == 'No Users') {
					antdHelper.noti('Face Vector not Registered. Please enroll.');
					// setCameraCaptureStart(true);
				} else if (resStateText == 'Move Closer') {
					antdHelper.noti('Please Move Closer!');
				} else if (resStateText == 'Go Back') {
					antdHelper.noti('Please Move Back!');						
				} else if (resStateText == "Error" ) {
					if (res.data.msg.includes("Dialog is closed")) {
						clearInterval(intervalVerify);
						setVerifySpinActive(false);
						return ;
					}
					antdHelper.noti(res.data.msg);
					if (res.data.msg == 'DB sync error') {
						clearInterval(intervalVerify);
						setVerifySpinActive(false);
						return ;
					}
				} else {
					antdHelper.noti('Error');						
				}
			} else {				
			}
		}).catch(err=>{
			console.log('err', err);
			// antdHelper.noti('Server Error. Please contact dev team.');		
		})
	}

	const recoverUser = () => {
		if( recoveryKey.length == 0) {
			antdHelper.noti('Please Input Recovery Key!');						
			return ;
		}
		setSelectButton('recover');
		setRecoverSpinActive(true);
		setEnrollSpinActive(false);
		setVerifySpinActive(false);
		if(!WebcamStarted) {
			setWebcamStarted(true);
		}
		intervalRecover = setInterval(() => { recoverRequest() }, intervalTime);
	};

	const recoverRequest = () => {
		console.log('call create wallet func');
		const imgSrc = WebCamRef.getScreenshot();
		Axios.post(process.env.REACT_APP_SERVER_URL+"/recover_wallet", {
			image: imgSrc,
			recovery_key: recoveryKey
		}).then(res=>{
			console.log('res', res);
			if (res.status == 200) {
				const resStateText = res.data.status;
				if (resStateText == 'Success') {
					antdHelper.notiOK("User recovered successfully");
					clearInterval(intervalRecover);
					
					setRecoverSpinActive(false);
				} else if (resStateText == 'Unregistered User') {
					antdHelper.noti(res.data.msg);
					clearInterval(intervalRecover);
					setRecoverSpinActive(false);

				} else if (resStateText == "Error" ) {
					if (res.data.msg.includes("Dialog is closed")) {
						clearInterval(intervalRecover);
						setRecoverSpinActive(false);
						return ;
					}
					antdHelper.noti(res.data.msg);
				} else if (resStateText == 'Move Closer') {
					antdHelper.noti('Please Move Closer!');
				} else if (resStateText == 'Go Back') {
					antdHelper.noti('Please Move Back!');
				} else if (resStateText == 'Liveness check failed') {
					antdHelper.noti('Liveness check failed!');
				} else if (resStateText == 'Face is too large'){
					antdHelper.noti('Face is too large.');
				} else if (resStateText == 'Spoof'){
					antdHelper.noti('Spoof');
				} else {
					console.log('Error');
				}
			} else {		
				antdHelper.noti('Backend Error: Not responding correctly');
			}
		}).catch(err=>{
			console.log('err', err);
			// antdHelper.noti('Server Error. Please contact dev team');
		})

	}

	const _handleModalClose = () => {
		stopCamera();
		setIsActiveButton(false);
		setEnrollSpinActive(false);
		setVerifySpinActive(false);
		if (intervalVerify != null)
			clearInterval(intervalVerify)

		if (intervalEnroll != null)
			clearInterval(intervalEnroll);
	}

	useEffect(()=>{
		setWebcamStarted(true);
		return () => {
			clearInterval(intervalEnroll);
			clearInterval(intervalVerify);
			clearInterval(intervalRecover);
		}
	},[])

	useEffect(() => {
		console.log('webcarmstarted', WebcamStarted);
		if (!WebcamStarted) {
			stopFaceDetection();
			setIsDetected(false);
		}  else {
		}
	}, [WebcamStarted]);


	useEffect(()=>{
		setTimeout(()=> {
			setIsActiveButton(true);
		}, intervalTime);
	},[isDetected])

	return WebcamStarted ? (
		<div className="flex flex-col justify-center gap-y-[10px]">
			<div style={{height:`calc(${height}px + 10px)`, width: `calc(${width}px + 10px)`}} className="rounded-[3px] p-[5px] bg-white relative">
				{/* {!WebCamRef && (
					<SpinWrapper>
						<Spin size="large" />
					</SpinWrapper>
				)} */}
				<div style={{ margin: "auto", height: "100%"}}>
					<AnimationWrapper>
						{WebcamStarted ? (
						<Webcam
							audio={false}
							height={resolution.height}
							width={MainWidth}
							videoConstraints={{ width: MainWidth, height: resolution.height }}
							style={View}
							onLoadedMetadata={()=>{
								if (WebcamStarted)
									handleWebcamStream()
							}}
							ref={webcamRef}
						/>
						):(<></>)}
						<Col xs={12} sm={9} style={{opacity:.3}}>
							<ReactBodymovin options={bodymovinOptions}/>
						</Col>
						<canvas style={View} ref={canvasRef}/>
					</AnimationWrapper>
				</div>
			</div>
			<div>
				<div className="flex flex-col justify-center gap-y-[10px]">
					<div className="w-[100%] flex justify-between">
						<button onClick={enrollUser} className={`${selectButton =='enroll' ? 'active':''} border border-white text-[14px] w-[100px] py-1 text-white rounded-[2px]`}>ENROLL
							<Spin spinning={isEnrollSpinActive} size="small"  style={{marginLeft:'10px'}}></Spin>
						</button>
						<button onClick={verifyUser} className={`${selectButton =='verify'?'active':''} border border-white  text-[14px] w-[100px] py-1 text-white rounded-[2px]`}>VERIFY
							<Spin spinning={isVerifySpinActive} size="small" style={{marginLeft:'10px'}}></Spin>
						</button>
						<button onClick={recoverUser} className={`${selectButton =='recover'?'active':''} border border-white text-[14px] w-[100px] py-1 text-white rounded-[2px]`}>RECOVER
							<Spin spinning={isRecoverSpinActive} size="small" style={{marginLeft:'10px'}}></Spin>
						</button>
					</div>
					<div>
						<input placeholder="Enter your recover key" className="border border-sky-800 bg-white px-[5px] py-1 text-[14px] text-[#07385e] rounded-[2px] w-[100%] block" value={recoveryKey} onChange={(e) => setRecoveryKey(e.target.value)}/>
					</div>
				</div>
			</div>
		</div>
	):(<div onClick={()=>{setWebcamStarted(true); }} className="cursor-pointer">Turn on your camera {WebcamStarted}</div>);
};
export default CameraComp;