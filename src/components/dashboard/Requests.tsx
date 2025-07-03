import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, User, Book, MapPin, MessageSquare, Package, Calendar, Navigation, AlertCircle, Eye, Route } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookRouteMap } from "./BookRouteMap";
import { LeafletBookRouteMap } from "./LeafletBookRouteMap";
import { ChatModal } from "./ChatModal";
import { DeliveryConfirmationModal } from "./DeliveryConfirmationModal";
import { DeliveryDateSelector } from "./DeliveryDateSelector";
import { RequestPreviewModal } from "./RequestPreviewModal";
import { EnhancedLocationDisplay } from "./EnhancedLocationDisplay";

interface PurchaseRequest {
  id: string;
  book_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  expected_delivery_date?: string;
  book_title?: string;
  book_price?: number;
  buyer_name?: string;
  buyer_location?: string;
  buyer_latitude?: number;
  buyer_longitude?: number;
  seller_latitude?: number;
  seller_longitude?: number;
  offered_price?: number;
  transfer_mode?: string;
  message?: string;
}

export const Requests = (props) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequestForChat, setSelectedRequestForChat] = useState<string | null>(null);
  const [selectedRequestForDelivery, setSelectedRequestForDelivery] = useState<string | null>(null);
  const [selectedRequestForDate, setSelectedRequestForDate] = useState<string | null>(null);
  const [selectedRequestForPreview, setSelectedRequestForPreview] = useState<PurchaseRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchRequests = async () => {
    if (!props.userId) {
      setError("User ID not provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching requests for user:', props.userId);
      
      const { data, error } = await supabase
        .from("purchase_requests")
        .select(`
          id, book_id, buyer_id, seller_id, status, created_at, expected_delivery_date,
          offered_price, transfer_mode, message,
          books (title, price_range),
          buyer_profile:profiles!buyer_id (full_name, location_address, latitude, longitude)
        `)
        .eq("seller_id", props.userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }

      console.log('Fetched requests data:', data);

      const enrichedRequests: PurchaseRequest[] = data?.map(request => ({
        id: request.id,
        book_id: request.book_id,
        buyer_id: request.buyer_id,
        seller_id: request.seller_id,
        status: request.status as 'pending' | 'accepted' | 'rejected' | 'completed',
        created_at: request.created_at,
        expected_delivery_date: request.expected_delivery_date,
        book_title: request.books?.title,
        book_price: request.books?.price_range,
        buyer_name: request.buyer_profile?.full_name,
        buyer_location: request.buyer_profile?.location_address,
        buyer_latitude: request.buyer_profile?.latitude,
        buyer_longitude: request.buyer_profile?.longitude,
        seller_latitude: props.userProfile?.latitude,
        seller_longitude: props.userProfile?.longitude,
        offered_price: request.offered_price,
        transfer_mode: request.transfer_mode,
        message: request.message,
      })) || [];

      console.log('Enriched requests:', enrichedRequests);
      setRequests(enrichedRequests);
    } catch (error: any) {
      console.error('Error fetching purchase requests:', error);
      setError(error.message || "Failed to fetch purchase requests");
      toast({
        title: "Error",
        description: "Failed to fetch purchase requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [props.userId]);

  const handleAcceptRequest = async (requestId: string, deliveryDate: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("purchase_requests")
        .update({ 
          status: "accepted",
          expected_delivery_date: deliveryDate
        })
        .eq("id", requestId);

      if (error) throw error;

      // Send delivery notification
      await supabase.functions.invoke('send-delivery-notification', {
        body: { 
          purchaseRequestId: requestId,
          expectedDeliveryDate: deliveryDate
        }
      });

      toast({
        title: "Success",
        description: "Request accepted successfully. Delivery notification sent to buyer.",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("purchase_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "You have rejected the purchase request.",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliveryDateSet = async (requestId: string, date: string) => {
    try {
      const { error } = await supabase
        .from("purchase_requests")
        .update({ expected_delivery_date: date })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery date set successfully",
      });
      
      setSelectedRequestForDate(null);
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to set delivery date",
        variant: "destructive",
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const getDistanceColor = (distance: number) => {
    if (distance <= 2) return "text-green-600 bg-green-50 border-green-200";
    if (distance <= 5) return "text-blue-600 bg-blue-50 border-blue-200";
    if (distance <= 10) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getDistanceIcon = (distance: number) => {
    if (distance <= 5) return "🟢";
    if (distance <= 10) return "🟡";
    return "🔴";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading requests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error: {error}</span>
          </div>
          <div className="mt-4 text-center">
            <Button onClick={fetchRequests} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Book className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Requests</h3>
            <p className="text-gray-600 mb-4">
              You haven't received any purchase requests for your books yet.
            </p>
            <Button onClick={fetchRequests} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Purchase Requests ({requests.length})</span>
            <Button onClick={fetchRequests} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Book & Buyer</TableHead>
                  <TableHead>Distance & Location</TableHead>
                  <TableHead>Offer Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const buyer = request.buyer_latitude && request.buyer_longitude
                    ? { latitude: Number(request.buyer_latitude), longitude: Number(request.buyer_longitude) }
                    : null;
                  const seller = request.seller_latitude && request.seller_longitude
                    ? { latitude: Number(request.seller_latitude), longitude: Number(request.seller_longitude) }
                    : null;
                  
                  const canShowMap = buyer && seller;
                  const distance = canShowMap 
                    ? calculateDistance(buyer.latitude, buyer.longitude, seller.latitude, seller.longitude)
                    : null;
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{request.book_title || "Unknown Book"}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {request.buyer_name || "Unknown Buyer"}
                          </div>
                          <div className="text-xs text-gray-500">{new Date(request.created_at).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-2">
                          {distance && (
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={`${getDistanceColor(distance)} font-medium`}
                              >
                                <Route className="h-3 w-3 mr-1" />
                                {distance} km {getDistanceIcon(distance)}
                              </Badge>
                            </div>
                          )}
                          {request.buyer_location && (
                            <div className="text-sm flex items-start gap-1">
                              <MapPin className="h-3 w-3 mt-0.5 text-gray-500" />
                              <span className="text-gray-600 text-xs">{request.buyer_location}</span>
                            </div>
                          )}
                          {!request.buyer_location && !buyer && (
                            <div className="text-sm text-gray-400">No location provided</div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-green-600">₹{request.offered_price}</div>
                          <div className="text-sm text-gray-600 capitalize">{request.transfer_mode?.replace('-', ' ')}</div>
                          {request.message && (
                            <div className="text-xs text-gray-500 italic max-w-32 truncate" title={request.message}>
                              "{request.message}"
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {request.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                        {request.status === 'accepted' && <Badge className="bg-green-100 text-green-800 border-0">Accepted</Badge>}
                        {request.status === 'rejected' && <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>}
                        {request.status === 'completed' && <Badge className="bg-blue-100 text-blue-800 border-0">Completed</Badge>}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-2">
                          {/* Primary Actions for Pending Requests */}
                          {request.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => setSelectedRequestForPreview(request)}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          )}

                          {/* Secondary Actions for Accepted/Completed Requests */}
                          {(request.status === 'accepted' || request.status === 'completed') && (
                            <div className="flex flex-wrap gap-1">
                              {/* Chat Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRequestForChat(request.id)}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Chat
                              </Button>

                              {/* Set Delivery Date (only if accepted and no date set) */}
                              {request.status === 'accepted' && !request.expected_delivery_date && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRequestForDate(request.id)}
                                  className="bg-orange-600 text-white hover:bg-orange-700"
                                >
                                  <Calendar className="w-4 h-4 mr-1" />
                                  Set Date
                                </Button>
                              )}

                              {/* Delivery Confirmation (only if accepted and date is set) */}
                              {request.status === 'accepted' && request.expected_delivery_date && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRequestForDelivery(request.id)}
                                  className="bg-green-600 text-white hover:bg-green-700"
                                >
                                  <Package className="w-4 h-4 mr-1" />
                                  Delivery
                                </Button>
                              )}

                              {/* View Map */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!canShowMap}
                                    className="bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300"
                                  >
                                    <MapPin className="w-4 h-4 mr-1" />
                                    Map
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh]">
                                  <DialogHeader>
                                    <DialogTitle>Buyer & Seller Locations</DialogTitle>
                                  </DialogHeader>
                                  {canShowMap && (
                                    <div className="mt-4">
                                      <LeafletBookRouteMap
                                        buyer={buyer}
                                        seller={seller}
                                      />
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}

                          {/* Status Info */}
                          {request.expected_delivery_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              Expected: {new Date(request.expected_delivery_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Request Preview Modal */}
      {selectedRequestForPreview && (
        <RequestPreviewModal
          isOpen={!!selectedRequestForPreview}
          onClose={() => setSelectedRequestForPreview(null)}
          request={selectedRequestForPreview}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
          loading={actionLoading}
        />
      )}

      {/* Chat Modal */}
      {selectedRequestForChat && (
        <ChatModal
          isOpen={!!selectedRequestForChat}
          onClose={() => setSelectedRequestForChat(null)}
          requestId={selectedRequestForChat}
          currentUserId={props.userId}
        />
      )}

      {/* Delivery Confirmation Modal */}
      {selectedRequestForDelivery && (
        <DeliveryConfirmationModal
          isOpen={!!selectedRequestForDelivery}
          onClose={() => setSelectedRequestForDelivery(null)}
          purchaseRequestId={selectedRequestForDelivery}
          userType="seller"
          bookTitle={requests.find(r => r.id === selectedRequestForDelivery)?.book_title || ""}
          bookPrice={requests.find(r => r.id === selectedRequestForDelivery)?.book_price || 0}
        />
      )}

      {/* Delivery Date Selector Modal */}
      {selectedRequestForDate && (
        <Dialog open={!!selectedRequestForDate} onOpenChange={() => setSelectedRequestForDate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Expected Delivery Date</DialogTitle>
            </DialogHeader>
            <DeliveryDateSelector
              onDateSelect={(date) => handleDeliveryDateSet(selectedRequestForDate, date)}
              onCancel={() => setSelectedRequestForDate(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}