import React, { useState, useEffect } from "react";
import { Spin, Tooltip } from "antd";
import copy from "copy-to-clipboard";
import moment from "moment";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { typesBundle } from '@polkadot/apps-config';
import { AccountInfo } from '@polkadot/types/interfaces';
import QrSvg from "@wojtekmaj/react-qr-svg";


import CameraComp from "../camera";
import Header from "../header";
import * as formatter from "../../utils/formatter";
import * as antdHelper from "../../utils/antd-helper";
import store from "../../utils/store";
// import animation from '@src/utils/data/bodymovin-animation.json';
import webconfig from '../../webconfig';
import request from '@src/utils/request';
import { SubmittableExtrinsic } from "@polkadot/api/types";

interface SDKConfig {
	nodeURL: string | string[];
	keyringOption: {
		type: 'ed25519' | 'sr25519' | 'ecdsa';
		ss58Format: number;
	};
	gatewayURL?: string;
	gatewayAddr?: string;
}

interface Account {
  address: string;
  mnemonic: string;
}

interface FormatParam {
	amount: string,
	address: string
}

interface TransactionHistory {
  key: string;
  amount: string;
  type: string;
  from: string;
  fromShort: string;
  to: string;
  toShort: string;
  time: string;
}

interface Response {
	hash: string,
	amount: string,
	from: string,
	to: string,
	timestamp: number
}

interface ResponseData {
	content: Response[],
	count: number
}
let unsubBalance;
// let sdk = null;
interface InputValue {
	staking: {
		amount: string;
		address: string;
	};
	send: {
		amount: string;
		address: string;
	};
	nominate: {
		amount: string;
		address: string;
	};
}

let pageIndex = 1;
let historyCount = 0;
let historyTotalPage = 0;

function Home() {
	const [loading, setLoading] = useState<string | null>(null);
	const [current, setCurrent] = useState<string>("login");
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [account, setAccount] = useState<Account>({address: "", mnemonic: ""});
	const [balance, setBalance] = useState<number>(0);
	const [boxTitle, setBoxTitle] = useState<string>("");
	const [available, setAvailable] = useState<number>(0);
	const [staking, setStaking] = useState<number>(0);
	const [nominate, setNominate] = useState<number>(0);
	const [historys, setHistorys] = useState<TransactionHistory[]>([]);
	const [customRPC, setCustomRPC] = useState<string>("");
	const [inputValue, setInputValue] = useState<InputValue>({
		staking: { amount: "0", address: "" },
		send: { amount: "0", address: "" },
		nominate: { amount: "0", address: "" }
	});

	let historyTimeout: NodeJS.Timeout | undefined = undefined;

	const InitAPI = async (config: SDKConfig) => {
		try {
			// Use the first URL if `nodeURL` is an array
			const url = Array.isArray(config.nodeURL) ? config.nodeURL[0] : config.nodeURL;
		
			// Create a WebSocket provider
			const provider = new WsProvider(url);
		
			// Create the API instance
			const api = await ApiPromise.create({
				provider,
				typesBundle // Use custom types if necessary, you may omit this if not needed
			});
		
			// Create a keyring instance
			const keyring = new Keyring({
				type: config.keyringOption.type,
				ss58Format: config.keyringOption.ss58Format
			});
		
			// Log to confirm setup is complete
			antdHelper.noti(`API connected to ${url}, keyring set for type ${config.keyringOption.type}`);
		
			return { api, keyring };
		} catch (error) {
			console.error(`Failed to initialize API or keyring: ${error}`);
			throw error; // Rethrow the error after logging it
		}
	}

	useEffect(() => {
		const url = store.get<string>("custom-node");
		if (url) {
			setCustomRPC(url);
		}
		init(url);
		autoLogin();
		historyTimeout = setInterval(function () {
			const addr = store.get<string>("addr");
			if (addr && account && account.address) {
				loadHistoryList(addr);
			}
		}, 5000);

		createWalletTestFromFace("cXjc4Lb8bhC9c7R9o4zowPtw5GTwyzxbGk32uRzrbDnyJYg5E", "february duck borrow there dynamic original screen clip harsh drive bird tunnel");
		return () => {
			clearInterval(historyTimeout);
			// if (unsubBalance) {
			// 	unsubBalance();
			// }
		};
	}, []);

	const init = async (url: string | null) => {
		try {
			const config = JSON.parse(JSON.stringify(webconfig.sdkConfig));
			if (url && url != "wss://testnet-rpc1.cess.cloud/ws/") {
				config.nodeURL = url;
			}
			const { api, keyring } = await InitAPI(config);
			if (api) {
				window.api = api;
				window.keyring = keyring;
				if (customRPC && url && url != "wss://testnet-rpc1.cess.cloud/ws/") {
					store.set<string>("custom-node", url);
				}
			}
			antdHelper.noti("rpc connect success");

			return { api, keyring };
		} catch (e) {
			antdHelper.noti("has error");
			console.log(e);
		}
	};

	const autoLogin = async () => {
		const addr = store.get<string>("addr");
		const mnemonic = store.get<string>("mnemonic");
		if (!addr || !mnemonic) {
			return;
		}
		setCurrent("dashboard");
		setAccount({ address: addr, mnemonic: mnemonic });
		loadHistoryList(addr);
	};
	
	const createWalletTestFromFace = (addr: string, mnemonic: string) => {
		const addrFromFace = addr;
		const acc = {
			address: addrFromFace,
			mnemonic: mnemonic,
		};
		setAccount(acc);
		setAccounts([acc]);
		setAccount(acc);
		accounts;
		setCurrent("dashboard");

		subBalance(addrFromFace);
		setAvailable(0);
		setStaking(0);
		setNominate(0);
		setBalance(0);
		//end
		pageIndex = 1;
		loadHistoryList(acc.address);
		store.set<string>("addr", addrFromFace);
	};

	const subBalance = async (address: string) => {
		// if (unsubBalance) {
		// 	unsubBalance();
		// }
		unsubBalance = await window.api?.query.system.account(address, ({ nonce, data }: { nonce: number, data: AccountInfo['data'] }) => {
			antdHelper.noti('Nonce:' + nonce);
			antdHelper.noti('Free balance:' + data.free.toString()); // Assuming `data.free` is of Balance type
			antdHelper.noti('Reserved balance:' + data.reserved.toString());

			// If you have specific handlers or state updates in React
			const availableB = formatter.fixedBigInt(data.free.toBigInt() / (1n * 10n ** 18n));
			setAvailable(availableB);
			const stakingB = formatter.fixedBigInt(data.reserved.toBigInt() / (1n * 10n ** 18n));
			setStaking(stakingB);
			const nominateB = formatter.fixedBigInt(data.feeFrozen.toBigInt() / (1n * 10n ** 18n));
			setNominate(nominateB);
			const all = availableB + stakingB + nominateB;
			antdHelper.noti("Balance:" + all);
			setBalance(all);
			loadHistoryList(address);
		});
		return unsubBalance;
	};

	const onClick = (e: string) => {
		setCurrent(e);
		setBoxTitle(e);
	};

	const onCopy = (txt: string):void => {
		copy(txt);
		antdHelper.notiOK("Copied");
	};

	const onLogout = () => {
		// if (unsubBalance) {
		// 	unsubBalance();
		// }
		antdHelper.notiOK("Logout success.");
		setAccount({address: "", mnemonic: ""});
		setCurrent("login");
		store.remove("addr");
	};

	// const subState = (d: any) => {
	// 	antdHelper.noti(d);
	// 	if (typeof d == "string") {
	// 		antdHelper.noti(d);
	// 	}
	// 	else {
	// 		antdHelper.noti(d.status.toString());
	// 	}
	// };

	const onSend = () => {
		try {
			const ret = formatParams(inputValue.send);
			if (!ret) {
				return;
			}
			const { address, amount } = ret;
			antdHelper.noti('address:' + address + ' amount:' + amount );
			const extrinsic = window.api?.tx.balances.transfer(address, amount);
			if (!extrinsic) {
				console.error('Failed to create extrinsic');
				return;
			}
			submitTx(extrinsic);
		} catch (e) {
			let msg = (e as Error).message;
			if (msg.includes("MultiAddress")) {
				msg = "Please input the correct amount and receiving address.";
			}
			antdHelper.alertError(msg);
		}
	};

	const onStaking = () => {
		try {
			const ret = formatParams(inputValue.staking);
			if (!ret) {
				return;
			}
			const { address, amount } = ret;
			const extrinsic = window.api?.tx.sminer.increaseCollateral(address, amount);
			if (!extrinsic) {
				console.error('Failed to create extrinsic');
				return;
			}
			submitTx(extrinsic);
		} catch (e) {
			antdHelper.alertError((e as Error).message);
		}
	};

	const onNominate = async () => {
		try {
			const ret = formatParams(inputValue.nominate);
			if (!ret) {
				return;
			}
			const { address, amount } = ret;
			let extrinsic = window.api?.tx.staking.nominate([address]);
			if (!extrinsic) {
				console.error('Failed to create extrinsic');
				return;
			}
			const ret2 = await submitTx(extrinsic, true);
			if (ret2 && ret2.msg == "ok") {
				extrinsic = window.api?.tx.staking.bond(amount, "Staked");
				if (!extrinsic) {
					console.error('Failed to create extrinsic');
					return;
				}
				submitTx(extrinsic);
			}
		} catch (e) {
			antdHelper.alertError((e as Error).message);
		}
	};

	const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>, k1: keyof InputValue, k2: keyof InputValue['staking']) => {
		setInputValue(prevState => ({
			...prevState,
			[k1]: {
				...prevState[k1],
				[k2]: e.target.value
			}
		}));
	};

	const loadHistoryList = async (addr: string) => {
		const address = addr || account.address;
		if (!address) {
			antdHelper.noti("address is null ,jump to load history.");
			return;
		}
		const url = `/transfer/query?Acc=${address}&pageindex=${pageIndex}&pagesize=${webconfig.historyPageSize}`;
		const ret = await request(url);
		
		if (ret.msg != "ok") {
			return antdHelper.notiError(ret.msg || "Request Error");
		}
		if( typeof ret.data != "object" ) return ;
		const data = ret.data as ResponseData;
		if (!data.content) {
			return antdHelper.notiError("API error");
		}
		
		const list = data.content.map((t: Response) => {
			return {
				key: t.hash,
				amount: formatter.formatBalance(t.amount),
				type: t.from == address ? "Send" : "Receive",
				from: t.from,
				fromShort: formatter.formatAddress(t.from),
				to: t.to,
				toShort: formatter.formatAddress(t.to),
				time: moment(t.timestamp).format("YYYY/MM/DD HH:mm:ss")
			};
		});
		historyCount = data.count;
		historyTotalPage = historyCount / webconfig.historyPageSize;
		if (historyCount % webconfig.historyPageSize != 0) {
			historyTotalPage++;
		}
		setHistorys(list);
	};

	const onNextHistoryPage = (l: number) => {
		pageIndex = pageIndex + l;
		const addr = store.get<string>("addr");
		if( addr )
			loadHistoryList(addr);
	};

	const formatParams = (obj: FormatParam): {address: string, amount: bigint} | null => {
		if (!obj.amount) {
			antdHelper.alertError("Amount is required.");
			return null;
		}
		if (obj.amount.length > 29) {
			antdHelper.alertError("The amount character length exceeds the limit.");
			return null;
		}
		if (isNaN(parseFloat(obj.amount))) {
			antdHelper.alertError("The Amount allow only numbers input.");
			return null;
		}
		const amount = parseFloat(obj.amount);
		if (amount < 0) {
			antdHelper.alertError("Amount error.");
			return null;
		}
		if (amount > available) {
			antdHelper.noti('amount: ' + amount + ' available: ' + available);
			antdHelper.alertError("Insufficient Balance");
			return null;
		}
		const ret_amount = BigInt(amount * 1e18);

		if (!obj.address) {
			antdHelper.alertError("Account address is required.");
			return null;
		}
		if (obj.address.length < 40 || obj.address.length > 49) {
			antdHelper.alertError("Please input the correct receiving address.");
			return null;
		}
		return { address: obj.address, amount: ret_amount };
	};

	const backToDashboard = () => {
		setInputValue({
			staking: { amount: "0", address: "" },
			send: { amount: "0", address: "" },
			nominate: { amount: "0", address: "" }
		});
		document.querySelectorAll<HTMLTextAreaElement>(".textarea1").forEach(t => {
			t.value = "";
		});
		document.querySelectorAll<HTMLTextAreaElement>(".textarea2").forEach(t => {
			t.value = "";
		});
		setCurrent("dashboard");
		const addr = store.get<string>("addr");
		if(addr) loadHistoryList(addr);
	};

	const submitTx = async (extrinsic: SubmittableExtrinsic<'promise'>, hideSuccessTips: boolean = false) => {
		let ret;
		try {
			setLoading("signature");
			// sdk = new Common(window.api, window.keyring);
			antdHelper.noti(" -------ppppppppp ")
			antdHelper.noti(account.mnemonic);
			antdHelper.noti(" ppppppppp------- ")
			const wallet = window.keyring?.addFromMnemonic(account.mnemonic);
			if (!wallet) {
				console.error('Failed to create wallet');
				return;
			}
			const hash = await extrinsic.signAndSend(wallet);
			antdHelper.noti("txhash: " + hash);
			// ret = await sdk.signAndSend(account.address, extrinsic, subState);
			ret = { msg: "ok", data: hash };
			if (ret.msg == "ok") {
				if (!hideSuccessTips) {
					if (current == "Nominate") {
						antdHelper.alertOk("The Nomination is submitted", `txhash: ${ret.data}`);
					} else {
						antdHelper.alertOk("The transaction is submitted.", `txhash: ${ret.data}`);
					}
					backToDashboard();
				}
			} else {
				antdHelper.alertError(ret.msg, ret.data);
			}
		} catch (e) {
			let msg = (e as Error).message || e as Error;
			if (typeof msg == "object") {
				msg = JSON.stringify(msg);
			}
			if (msg.includes("balance too low")) {
				antdHelper.alertError("Insufficient Balance");
			} else {
				antdHelper.alertError(msg);
			}
		} finally {
			setLoading(null);
		}
		return ret;
	};

	// const onSelectAccountForInput = async () => {
	// 	let acc = await antdHelper.showSelectAccountBox(accounts);
	// 	inputValue = {
	// 		staking: { amount: 0, address: acc.address },
	// 		send: { amount: 0, address: acc.address },
	// 		nominate: { amount: 0, address: acc.address }
	// 	};
	// 	let t1 = document.querySelectorAll(".textarea2");
	// 	t1.forEach(t => (t.value = acc.address));
	// };

	// const onReConnect = async (e: any) => {
	// 	let timeout = setTimeout(function () {
	// 		antdHelper.alertError("Connect timeout");
	// 	}, 5000);
	// 	let { api } = await init(customRPC);
	// 	clearTimeout(timeout);
	// 	if (api) {
	// 		antdHelper.notiOK("Connected");
	// 	} else {
	// 		antdHelper.alertError("Connect failed");
	// 	}
	// };

	return (
		<div className="Home h-[100%] w-[100%]">
			{	current == "login" &&
				<div className="px-[15px] pt-[15px] pb-[45px] flex flex-col justify-start h-[100%] items-center">
					<div>
						<span className="h-[25px] mb-[-6px] ml-[2px] w-[100%] flex flex-col items-center justify-center text-white align-middle">
							<h1 className="text-sm font-bold tracking-tighter text-white"> ANON ID</h1>
						</span>
						<Header />
					</div>
					<div className="rounded-[3px] py-[10px]">
						<CameraComp setCessAddr={createWalletTestFromFace} />
					</div>
					<p className="text-[12px] font-black text-white tracking-[0.1px] text-bold block py-[45px] text-center">Anon ID does not store any faces only vector arrays</p>
				</div>
			}
			<div className={current == "dashboard" ? "dashboard" : "none"}>
				<div className="b1">
					<div className="btn" onClick={onLogout}></div>
					<div className="line l1">{formatter.toLocaleString(balance)} CESS</div>
					<div className="line l2">Balance</div>
					<div className="line l3">
						<span className="txt">{formatter.formatAddressLong(account.address)} </span>
						<label className="icon" onClick={() => onCopy(account.address)}></label>
					</div>
					{/* <div className={accountType == "face" ? "line l4" : "none"}>
						<label className="icon"></label>
						<span className="txt">Show the CESS address</span>
					</div> */}
				</div>
				<div className="b2">
					<div className="btn-box btn1" onClick={() => onClick("Send")}>
						Send
					</div>
					<div className="btn-box btn2" onClick={() => onClick("Receive")}>
						Receive
					</div>
					<div className="btn-box btn3" onClick={() => onClick("Staking")}>
						Staking
					</div>
					<div className="btn-box btn4" onClick={() => onClick("Nominate")}>
						Nominate
					</div>
				</div>
				<div className="b3">
					<div className="b3-t">Asset Analysis</div>
					<div className="tb">
						<div className="tr">
							<span>Available</span>
							<label>{formatter.toLocaleString(available)} CESS</label>
						</div>
						<div className="tr">
							<span>Staking</span>
							<label>{formatter.toLocaleString(staking)} CESS</label>
						</div>
						<div className="tr">
							<span>Nominate</span>
							<label>{formatter.toLocaleString(nominate)} CESS</label>
						</div>
					</div>
				</div>
				<div className="b4">
					<div className="t1">History</div>
					<div className="tb">
						{historys &&
							historys.map((t: TransactionHistory) => {
								return (
									<div className="tr" key={t.key}>
										<div className="left">
											<span className="amount">
												<Tooltip title={t.type == "Send" ? "-" + t.amount : "+" + t.amount}>
													<span className="o-text">
														{t.type == "Send" ? "-" : "+"}
														{t.amount}
													</span>
												</Tooltip>
											</span>
											<label className="type">{t.type}</label>
										</div>
										<div className="right">
											<span title="copy" onClick={() => onCopy(t.from)}>
												From {t.fromShort}
											</span>
											<label title="copy" onClick={() => onCopy(t.to)}>
												To {t.toShort}
											</label>
											{/* <font>{t.time}</font> */}
										</div>
									</div>
								);
							})}
						{!historys || historys.length == 0 ? <div className="no-data">No data</div> : ""}
					</div>
					<div className={historys && historys.length && historyTotalPage > 1 ? "pager" : "none"}>
						<div className={pageIndex == 1 ? "none" : "pre"} onClick={() => onNextHistoryPage(-1)}></div>
						<div className={pageIndex >= historyTotalPage ? "none" : "next"} onClick={() => onNextHistoryPage(1)}></div>
					</div>
				</div>
			</div>
			<div className={"Send,Receive,Staking,Nominate".includes(current) ? "box-out" : "none"}>
				<div className="box">
					<div className="top-header">
						<div className="back" onClick={backToDashboard}></div>
						{boxTitle}
					</div>
					<div className={current == "Send" ? "send" : "none"}>
						<div className="myinput">
							<div className="tips">
								<span>Receiving Address</span>
								{/* <label className={accountType == "polkdot" && accounts && accounts.length > 1 ? "none" : "none"} onClick={onSelectAccountForInput}>
									+
								</label> */}
							</div>
							<textarea
								maxLength={49}
								onChange={e => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "send", "address")}
								onInput={e => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "send", "address")}
								placeholder="cX"
								className="textarea2"></textarea>
						</div>
						<div className="myinput">
							<div className="tips">Amount(CESS)</div>
							<textarea
								maxLength={29}
								onChange={e => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "send", "amount")}
								onInput={e => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "send", "amount")}
								placeholder="0"
								className="textarea1"></textarea>
						</div>
						<div className="t1">Balance: {formatter.toLocaleString(available)} CESS</div>
						{loading == "signature" ? (
							<div className="btn btn-disabled">
								<Spin size="small" />
								&nbsp;&nbsp;Loading...
							</div>
						) : (
							<div className="btn" onClick={onSend}>
								Signature
							</div>
						)}
					</div>
					<div className={current == "Receive" ? "receive" : "none"}>
						<div className="qr">{account?.address && <QrSvg value={account?.address} />}</div>
						<div className="show-address">
							<div className="tips">Receiving Address</div>
							<div className="address">{account?.address}</div>
							<div className="btn-copy" onClick={() => onCopy(account?.address)}></div>
						</div>
					</div>
					<div className={current == "Staking" ? "staking" : "none"}>
						<div className="myinput">
							<div className="tips">
								<span>Storage Miner Account</span>
								{/* <label className={accountType == "polkdot" && accounts && accounts.length > 1 ? "none" : "none"} onClick={onSelectAccountForInput}>
									+
								</label> */}
							</div>
							<textarea
								maxLength={49}
								onChange={e => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "staking", "address")}
								onInput={e => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "staking", "address")}
								placeholder="cX"
								className="textarea2"></textarea>
						</div>
						<div className="myinput">
							<div className="tips">Staking Amount(CESS)</div>
							<textarea
								maxLength={29}
								onChange={e => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "staking", "amount")}
								onInput={e => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "staking", "amount")}
								placeholder="0"
								className="textarea1"></textarea>
						</div>
						<div className="t1">Balance: {formatter.toLocaleString(available)} CESS</div>
						{loading == "signature" ? (
							<div className="btn btn-disabled">
								<Spin size="small" />
								&nbsp;&nbsp;Loading...
							</div>
						) : (
							<div className="btn" onClick={onStaking}>
								Signature
							</div>
						)}
					</div>
					<div className={current == "Nominate" ? "nominate" : "none"}>
						<div className="myinput">
							<div className="tips">
								<span>Consensus Account</span>
								{/* <label className={accountType == "polkdot" && accounts && accounts.length > 1 ? "none" : "none"} onClick={onSelectAccountForInput}>
									+
								</label> */}
							</div>
							<textarea
								maxLength={49}
								onChange={(e) => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "nominate", "address")}
								onInput={(e) => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "nominate", "address")}
								placeholder="cX"
								className="textarea2"></textarea>
						</div>
						<div className="myinput">
							<div className="tips">Staking Amount(CESS)</div>
							<textarea
								maxLength={29}
								onChange={(e) => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "nominate", "address")}
								onInput={(e) => onInput(e as React.ChangeEvent<HTMLTextAreaElement>, "nominate", "address")}
								placeholder="0"
								className="textarea1"></textarea>
						</div>
						<div className="t1">Balance: {formatter.toLocaleString(available)} CESS</div>
						{loading == "signature" ? (
							<div className="btn btn-disabled">
								<Spin size="small" />
								&nbsp;&nbsp;Loading...
							</div>
						) : (
							<div className="btn" onClick={onNominate}>
								Signature
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Home;
