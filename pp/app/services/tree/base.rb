# frozen_string_literal: true

class Tree::Base < ::Nsud::Essentials::ApplicationService

  def initialize(params, &policy_scoper)
    @params = params
    @policy_scoper = policy_scoper
    @parent_id = params[:parent_id]&.to_s
  end

  private

  attr_reader :params, :policy_scoper

  def policy_scope(scope)
    policy_scoper&.respond_to?(:call) ? policy_scoper.call(scope) : scope
  end

end
