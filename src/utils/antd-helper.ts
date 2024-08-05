
import { Modal, Select, message, notification } from "antd";
import copy from "copy-to-clipboard";
import { ReactNode } from "react";

interface Account {
  address: string;
  meta?: { name?: string };
}

export function alert(title: string): Promise<void> {
  return new Promise((resolve) => {
    const modal = Modal.info({
      title,
      onOk: () => {
        resolve();
      },
    });
  });
}

let loadingTipsIsShow = false;
export function loading(content: string | undefined): void {
  if (loadingTipsIsShow || !content) {
    loadingTipsIsShow = false;
    message.destroy();
    return;
  }
  loadingTipsIsShow = true;
  message.loading({
    content,
    duration: 0,
  });
}

export function confirm(title: string): Promise<boolean> {
  return new Promise((resolve) => {
    Modal.confirm({
      title,
      onOk: () => {
        resolve(true);
      },
      onCancel: () => {
        resolve(false);
      },
    });
  });
}

notification.config({
  placement: "topRight",
  top: 70,
  duration: 5,
  rtl: true,
});

export function noti(message: string): void {
  notification.open({ message });
}

export function notiOK(message: string): void {
  notification.success({ message });
}

export function notiError(message: string): void {
  notification.error({ message });
}

export function msgOK(msg: string): void {
  message.success(msg);
}

export function msgError(msg: string): void {
  message.error(msg);
}

export function alertOk(title: string, content: ReactNode = ""): void {
  Modal.success({
    title,
    content
  });
}

export function alertError(title: string, content: ReactNode = ""): void {
  Modal.error({
    title,
    content
  });
}