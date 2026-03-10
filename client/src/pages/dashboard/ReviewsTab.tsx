import { useQueries, useQuery } from "@tanstack/react-query";
import type { Dish, Review, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReviewWithClient = Review & { client: User };

export function ReviewsTab() {
    const { data: dishes } = useQuery<Dish[]>({ queryKey: ["/api/cook/dishes"] });

    const reviewResults = useQueries({
        queries: (dishes || []).map((dish) => ({
            queryKey: ["/api/dishes", String(dish.id), "reviews"],
            enabled: !!dish.id,
        })),
    });

    return (
        <Card className="rounded-xl shadow-sm">
            <CardHeader>
                <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {(dishes || []).map((dish, index) => {
                    const reviews = (reviewResults[index]?.data as ReviewWithClient[] | undefined) || [];

                    return (
                        <div key={dish.id} className="rounded-xl border p-4">
                            <h4 className="font-semibold mb-3">{dish.name}</h4>
                            <div className="space-y-3">
                                {reviews.length ? reviews.map((review) => (
                                    <div key={review.id} className="rounded-lg bg-muted/40 p-3">
                                        <p className="text-sm font-medium">{review.client?.firstName || "Client"} · {review.rating}/5</p>
                                        <p className="text-sm text-muted-foreground">{review.comment || "No comment"}</p>
                                        {!!review.photos?.length && (
                                            <div className="flex gap-2 mt-2">
                                                {review.photos.map((photo, photoIndex) => (
                                                    <img key={`${review.id}-${photoIndex}`} src={photo} className="h-12 w-12 rounded-md object-cover" alt="Review" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )) : <p className="text-sm text-muted-foreground">No reviews yet.</p>}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
