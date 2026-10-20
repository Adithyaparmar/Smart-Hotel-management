const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const amenityService = require('../services/amenity.service');

const createAmenity = asyncHandler(async (req, res) => {
  const amenity = await amenityService.createAmenity(req.body);
  return ApiResponse.success(res, { data: amenity, message: 'Amenity created', statusCode: 201 });
});
const updateAmenity = asyncHandler(async (req, res) => {
  const amenity = await amenityService.updateAmenity(req.params.id, req.body);
  return ApiResponse.success(res, { data: amenity, message: 'Amenity updated' });
});
const listAmenities = asyncHandler(async (req, res) => {
  const items = await amenityService.listAmenities(req.query);
  return ApiResponse.success(res, { data: items });
});
const deleteAmenity = asyncHandler(async (req, res) => {
  await amenityService.deleteAmenity(req.params.id);
  return ApiResponse.success(res, { message: 'Amenity deleted' });
});

module.exports = { createAmenity, updateAmenity, listAmenities, deleteAmenity };
