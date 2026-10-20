const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const staffService = require('../services/staff.service');

const createStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.createStaff(req.body);
  return ApiResponse.success(res, { data: staff, message: 'Staff member created', statusCode: 201 });
});

const listStaff = asyncHandler(async (req, res) => {
  const result = await staffService.listStaff(req.query);
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
});

const createTask = asyncHandler(async (req, res) => {
  const task = await staffService.createTask(req.user.id, req.body);
  return ApiResponse.success(res, { data: task, message: 'Task created', statusCode: 201 });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await staffService.updateTask(req.params.id, req.body);
  return ApiResponse.success(res, { data: task, message: 'Task updated' });
});

const listTasks = asyncHandler(async (req, res) => {
  const result = await staffService.listTasks(req.query);
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
});

const dashboard = asyncHandler(async (req, res) => {
  const data = await staffService.staffDashboard();
  return ApiResponse.success(res, { data });
});

module.exports = { createStaff, listStaff, createTask, updateTask, listTasks, dashboard };
