const { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  getNotificationStats 
} = require("../controllers/notification.controller");

const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");

// Routes pour les notifications
router.get("/", auth, getUserNotifications);
router.get("/stats", auth, getNotificationStats);
router.put("/:notificationId/read", auth, markAsRead);
router.put("/mark-all-read", auth, markAllAsRead);
router.delete("/:notificationId", auth, deleteNotification);

module.exports = router;
