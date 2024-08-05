import { notification } from 'antd';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

export const Notification = (
  type: NotificationType,
  title: string,
  description: string
): void => {
  notification[type]({
    message: title,
    description: description,
    duration: 2,
  });
};
