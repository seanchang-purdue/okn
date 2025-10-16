// src/components/drawers/CommunityResourcesModal.tsx
import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
} from "@heroui/react";
import type { ResourceDetails } from "../../types/communityResources";
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_COLORS,
} from "../../types/communityResources";

type CommunityResourcesModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: ResourceDetails | null;
  loading?: boolean;
};

const CommunityResourcesModal: React.FC<CommunityResourcesModalProps> = ({
  isOpen,
  onOpenChange,
  data,
  loading = false,
}) => {
  if (!data && !loading) return null;

  const typeColor =
    data?.resource_type && RESOURCE_TYPE_COLORS[data.resource_type]
      ? RESOURCE_TYPE_COLORS[data.resource_type]
      : "#6b7280";
  const typeLabel =
    data?.resource_type && RESOURCE_TYPE_LABELS[data.resource_type]
      ? RESOURCE_TYPE_LABELS[data.resource_type]
      : data?.resource_type || "Resource";

  // Parse JSON arrays from string (main_services, other_services, serving, languages, eligibility)
  const parseJsonString = (str: string | undefined): string[] => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const mainServices = parseJsonString(data?.main_services);
  const otherServices = parseJsonString(data?.other_services);
  const serving = parseJsonString(data?.serving);
  const languages = parseJsonString(data?.languages);
  const eligibility = parseJsonString(data?.eligibility);

  // Hours helper
  const hours = data
    ? [
        { day: "Monday", hours: data.monday_hours },
        { day: "Tuesday", hours: data.tuesday_hours },
        { day: "Wednesday", hours: data.wednesday_hours },
        { day: "Thursday", hours: data.thursday_hours },
        { day: "Friday", hours: data.friday_hours },
        { day: "Saturday", hours: data.saturday_hours },
        { day: "Sunday", hours: data.sunday_hours },
      ]
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-white dark:bg-gray-900",
        backdrop: "bg-black/50",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader
              className="flex flex-col gap-2 border-b border-gray-200 dark:border-gray-700 pb-4"
              style={{
                borderBottomColor: typeColor,
                borderBottomWidth: "3px",
              }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Loading resource details...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {data?.service_name}
                    </h2>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: typeColor }}
                    >
                      {typeLabel}
                    </span>
                  </div>
                  {data?.is_24hour && (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-orange-500 text-white text-xs font-semibold w-fit">
                      24/7 Service
                    </span>
                  )}
                </>
              )}
            </ModalHeader>

            <ModalBody className="py-6">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              ) : data ? (
                <div className="space-y-6">
                  {/* Location Section */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>📍</span> Location
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {data.location_address}
                      </p>
                      {data.location_url_map && (
                        <a
                          href={data.location_url_map}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        >
                          View on Google Maps
                        </a>
                      )}
                    </div>
                  </section>

                  {/* Contact Section */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>📞</span> Contact
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {data.phone_number && (
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          <a
                            href={`tel:${data.phone_number}`}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            {data.phone_number}
                          </a>
                        </div>
                      )}
                      {data.website && (
                        <div>
                          <span className="font-medium">Website:</span>{" "}
                          <a
                            href={data.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 underline break-all"
                          >
                            {data.website}
                          </a>
                        </div>
                      )}
                      {data.facebook_url && (
                        <div>
                          <span className="font-medium">Facebook:</span>{" "}
                          <a
                            href={data.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
                          >
                            Visit Page
                          </a>
                        </div>
                      )}
                      {data.twitter_url && (
                        <div>
                          <span className="font-medium">Twitter:</span>{" "}
                          <a
                            href={data.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
                          >
                            Visit Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Hours Section */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>🕐</span> Hours
                    </h3>
                    {data.is_24hour ? (
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        Open 24/7
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <tbody>
                          {hours.map(({ day, hours }) => (
                            <tr
                              key={day}
                              className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <td className="py-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                                {day}:
                              </td>
                              <td className="py-2 text-gray-600 dark:text-gray-400">
                                {hours || "Closed"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </section>

                  {/* Services Section */}
                  {(mainServices.length > 0 || otherServices.length > 0) && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span>🛠️</span> Services
                      </h3>
                      <div className="space-y-2 text-sm">
                        {mainServices.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Primary:
                            </span>
                            <ul className="list-disc list-inside ml-4 text-gray-600 dark:text-gray-400">
                              {mainServices.map((service, idx) => (
                                <li key={idx}>{service}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {otherServices.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Additional:
                            </span>
                            <ul className="list-disc list-inside ml-4 text-gray-600 dark:text-gray-400">
                              {otherServices.map((service, idx) => (
                                <li key={idx}>{service}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Eligibility Section */}
                  {eligibility.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span>✅</span> Eligibility
                      </h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {eligibility.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Who We Serve Section */}
                  {serving.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span>👥</span> Who We Serve
                      </h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {serving.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Description Section */}
                  {data.description && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span>ℹ️</span> About
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {data.description}
                      </p>
                    </section>
                  )}

                  {/* Additional Info Section */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>💰</span> Cost & Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Cost:
                        </span>{" "}
                        {data.cost || "Unknown"}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Availability:
                        </span>{" "}
                        <span
                          className={`${
                            data.availability === "available"
                              ? "text-green-600 dark:text-green-400"
                              : "text-orange-600 dark:text-orange-400"
                          } font-medium`}
                        >
                          {data.availability || "Unknown"}
                        </span>
                      </div>
                      {languages.length > 0 && (
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Languages:
                          </span>{" "}
                          {languages.join(", ")}
                        </div>
                      )}
                      {data.google_rating && (
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Rating:
                          </span>{" "}
                          ⭐ {data.google_rating.toFixed(1)}/5
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Coverage Section */}
                  {data.coverage && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span>🌍</span> Coverage Area
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {data.coverage}
                      </p>
                    </section>
                  )}
                </div>
              ) : null}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CommunityResourcesModal;
